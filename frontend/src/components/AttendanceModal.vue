<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  students: Array
})

const emit = defineEmits(['close', 'toggle-status'])

// Search & Filter
const searchQuery = ref('')
const statusFilter = ref('all') // 'all' | 'present' | 'absent'
const sortBy = ref('id') // 'id' | 'name' | 'score' | 'status'
const sortOrder = ref('asc') // 'asc' | 'desc'

// Filtered by search and status
const filteredStudents = computed(() => {
  let result = props.students
  
  // Status filter
  if (statusFilter.value === 'present') {
    result = result.filter(s => s.status !== 'absent')
  } else if (statusFilter.value === 'absent') {
    result = result.filter(s => s.status === 'absent')
  }
  
  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(query) ||
      (s.student_id && s.student_id.toLowerCase().includes(query))
    )
  }
  
  return result
})

// Sorted students
const displayedStudents = computed(() => {
  const list = [...filteredStudents.value]
  
  list.sort((a, b) => {
    let valA, valB
    
    if (sortBy.value === 'name') {
      valA = a.name
      valB = b.name
    } else if (sortBy.value === 'score') {
      valA = a.score || 0
      valB = b.score || 0
    } else if (sortBy.value === 'status') {
      valA = a.status === 'absent' ? 1 : 0
      valB = b.status === 'absent' ? 1 : 0
    } else {
      valA = a.id
      valB = b.id
    }
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  
  return list
})

// Toggle sort
const toggleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

const totalCount = computed(() => props.students.length)
const presentCount = computed(() => props.students.filter(s => s.status !== 'absent').length)
const absentCount = computed(() => props.students.filter(s => s.status === 'absent').length)
const attendanceRate = computed(() => {
  if (totalCount.value === 0) return '0%'
  return Math.round((presentCount.value / totalCount.value) * 100) + '%'
})

// Export column selection
const showExportModal = ref(false)
const exportColumns = ref({
  id: true,
  student_id: true,
  name: true,
  status: true,
  score: false,
  selection_count: false
})

const columnLabels = {
  id: '系统ID',
  student_id: '学号',
  name: '姓名',
  status: '状态',
  score: '分数',
  selection_count: '被抽中次数'
}

const exportToCSV = () => {
  // Build header based on selected columns
  const cols = Object.keys(exportColumns.value).filter(k => exportColumns.value[k])
  let csvContent = '\uFEFF' + cols.map(c => columnLabels[c]).join(',') + '\n'
  
  displayedStudents.value.forEach(s => {
    const row = cols.map(c => {
      if (c === 'status') return s.status === 'absent' ? '缺席' : '出勤'
      if (c === 'student_id') return s.student_id || ''
      if (c === 'score') return s.score || 0
      if (c === 'selection_count') return s.selection_count || 0
      return s[c]
    })
    csvContent += row.join(',') + '\n'
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  
  const date = new Date().toLocaleDateString().replace(/\//g, '-')
  const filterSuffix = statusFilter.value !== 'all' ? `_${statusFilter.value === 'present' ? '出勤' : '缺席'}` : ''
  link.setAttribute('download', `考勤表${filterSuffix}_${date}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showExportModal.value = false
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>班级考勤表</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </header>
      
      <div class="filter-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索姓名或学号..." 
          class="search-input"
        />
        <select v-model="statusFilter" class="filter-select">
          <option value="all">全部状态</option>
          <option value="present">仅出勤</option>
          <option value="absent">仅缺席</option>
        </select>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('id')">
                ID {{ sortBy === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th>学号</th>
              <th class="sortable" @click="toggleSort('name')">
                姓名 {{ sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th class="sortable" @click="toggleSort('score')">
                分数 {{ sortBy === 'score' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th class="sortable" @click="toggleSort('status')">
                状态 {{ sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in displayedStudents" :key="student.id" :class="{ absent: student.status === 'absent' }">
              <td>{{ student.id }}</td>
              <td>{{ student.student_id || '--' }}</td>
              <td>{{ student.name }}</td>
              <td class="score-cell">{{ student.score || 0 }}</td>
              <td>
                <span class="status-badge" :class="student.status === 'absent' ? 'absent' : 'present'">
                  {{ student.status === 'absent' ? '缺席' : '出勤' }}
                </span>
              </td>
              <td>
                <button class="toggle-btn" @click="emit('toggle-status', student.id, student.status)">
                  {{ student.status === 'absent' ? '改为出勤' : '记为缺席' }}
                </button>
              </td>
            </tr>
            <tr v-if="displayedStudents.length === 0">
              <td colspan="6" class="no-results">无匹配结果</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="modal-footer">
        <div class="stat-item">
          <span class="label">应到:</span>
          <span class="value">{{ totalCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">实到:</span>
          <span class="value present">{{ presentCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">缺席:</span>
          <span class="value absent">{{ absentCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">出勤率:</span>
          <span class="value">{{ attendanceRate }}</span>
        </div>
        <button class="export-btn" @click="showExportModal = true">
          导出表格
        </button>
      </footer>
    </div>
    
    <!-- Export Column Selection Modal -->
    <div v-if="showExportModal" class="export-modal-overlay" @click.self="showExportModal = false">
      <div class="export-modal">
        <h3>选择导出列</h3>
        <div class="column-options">
          <label v-for="(checked, key) in exportColumns" :key="key" class="column-checkbox">
            <input type="checkbox" v-model="exportColumns[key]" />
            {{ columnLabels[key] }}
          </label>
        </div>
        <div class="export-modal-actions">
          <button class="cancel-btn" @click="showExportModal = false">取消</button>
          <button class="confirm-export-btn" @click="exportToCSV">确认导出</button>
        </div>
      </div>
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
  max-width: 600px;
  max-height: 80vh;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

.filter-bar {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color, #6f42c1);
  box-shadow: 0 0 0 3px rgba(111, 66, 193, 0.1);
}

.search-input::placeholder {
  color: #94a3b8;
}

.no-results {
  text-align: center;
  color: #94a3b8;
  padding: 2rem;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background: #e2e8f0;
}

.filter-select {
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--primary-color, #6f42c1);
}

.score-cell {
  font-weight: 600;
  color: var(--primary-color, #6f42c1);
}

tr:hover {
  background: #f8fafc;
}

tr.absent {
  background: #fef2f2;
}

tr.absent:hover {
  background: #fee2e2;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.present {
  background: #dcfce7;
  color: #166534;
}

.status-badge.absent {
  background: #fee2e2;
  color: #991b1b;
}

.toggle-btn {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 0.75rem;
  color: #64748b;
}

.stat-item .value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.value.present { color: #166534; }
.value.absent { color: #ef4444; }

.export-btn {
  background: var(--primary-color, #6f42c1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;
}

.export-btn:hover {
  transform: scale(1.05);
  background: var(--primary-hover, #5a32a3);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Export Modal */
.export-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.export-modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 280px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.export-modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.column-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
}

.column-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color, #6f42c1);
}

.export-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f1f5f9;
}

.confirm-export-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--primary-color, #6f42c1);
  color: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-export-btn:hover {
  background: var(--primary-hover, #5a32a3);
}
</style>
