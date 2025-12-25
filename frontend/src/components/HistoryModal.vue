<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const history = ref([])
const loading = ref(false)

const modeLabels = {
  random: '随机模式',
  fair: '公平模式',
  rollCall: '签到模式'
}

const scoreLabels = {
  100: '已到',
  '-100': '缺席',
  2: '优秀 (+2)',
  1: '良好 (+1)',
  0: '合格 (+0)',
  '-1': '未答 (-1)'
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/history')
    history.value = await res.json()
  } catch (e) {
    console.error('获取历史记录失败', e)
  }
  loading.value = false
}

const clearHistory = async () => {
  if (!confirm('确定要清空所有历史记录吗？')) return
  try {
    await fetch('/api/history', { method: 'DELETE' })
    history.value = []
  } catch (e) {
    console.error('清空历史失败', e)
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch when modal opens
onMounted(() => {
  if (props.show) fetchHistory()
})

// Watch for show changes
import { watch } from 'vue'
watch(() => props.show, (newVal) => {
  if (newVal) fetchHistory()
})
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>抽取记录</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </header>
      
      <div class="table-container">
        <div v-if="loading" class="loading">加载中...</div>
        <table v-else>
          <thead>
            <tr>
              <th>时间</th>
              <th>学生</th>
              <th>模式</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in history" :key="h.id">
              <td class="time-cell">{{ formatTime(h.created_at) }}</td>
              <td>{{ h.student_name }}</td>
              <td>{{ modeLabels[h.mode] || h.mode }}</td>
              <td>
                <span v-if="h.score_delta !== null" class="score-badge" :class="{
                  present: h.score_delta === 100,
                  absent: h.score_delta === -100,
                  excellent: h.score_delta === 2,
                  good: h.score_delta === 1,
                  pass: h.score_delta === 0,
                  fail: h.score_delta < 0 && h.score_delta !== -100
                }">
                  {{ scoreLabels[h.score_delta] || (h.score_delta > 0 ? `+${h.score_delta}` : h.score_delta) }}
                </span>
                <span v-else class="pending">未评分</span>
              </td>
            </tr>
            <tr v-if="history.length === 0 && !loading">
              <td colspan="4" class="no-results">暂无记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="modal-footer">
        <span class="record-count">共 {{ history.length }} 条记录</span>
        <button class="clear-btn" @click="clearHistory" :disabled="history.length === 0">
          清空记录
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading {
  text-align: center;
  color: #64748b;
  padding: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
}

.time-cell {
  color: #64748b;
  font-size: 0.8rem;
}

.score-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.score-badge.present { background: #dcfce7; color: #166534; }
.score-badge.absent { background: #fee2e2; color: #991b1b; }
.score-badge.excellent { background: #dcfce7; color: #166534; }
.score-badge.good { background: #dbeafe; color: #1e40af; }
.score-badge.pass { background: #f1f5f9; color: #475569; }
.score-badge.fail { background: #fee2e2; color: #991b1b; }

.pending {
  color: #94a3b8;
  font-size: 0.8rem;
}

.no-results {
  text-align: center;
  color: #94a3b8;
  padding: 2rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-count {
  color: #64748b;
  font-size: 0.9rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ef4444;
  background: white;
  color: #ef4444;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
