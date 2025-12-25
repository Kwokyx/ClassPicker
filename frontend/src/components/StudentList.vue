<script setup>
import { ref } from 'vue'

const props = defineProps({
  students: Array
})

const emit = defineEmits(['refresh', 'delete-student', 'add-student', 'toggle-status', 'show-toast'])

const newStudentName = ref('')

const addStudent = async () => {
  console.log('Add button clicked', newStudentName.value)
  if (!newStudentName.value.trim()) return
  emit('add-student', newStudentName.value)
  newStudentName.value = ''
}

const deleteStudent = (id) => {
  deleteTargetId.value = id
  deleteModalContent.value = {
    title: '确认删除',
    message: '确定要删除该学生吗？',
    btnText: '删除',
    btnClass: 'delete-confirm-btn'
  }
  showDeleteModal.value = true
}


// Batch Import Logic
const showImportModal = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref(null) // null means 'Clear All', otherwise specific ID
const deleteModalContent = ref({
  title: '',
  message: '',
  btnText: '确认',
  btnClass: ''
})

const importNames = ref('')

const handleBatchImport = async () => {
  const lines = importNames.value.split('\n').filter(line => line.trim())
  if (lines.length === 0) return
  
  const students = lines.map(line => {
    line = line.trim()
    // Regex: First part is ID (alphanumeric), second part is Name. Separated by space.
    // E.g., "2023001 张三" -> id="2023001", name="张三"
    // "李四" -> id=null, name="李四"
    const match = line.match(/^([a-zA-Z0-9]+)\s+(.+)$/)
    if (match) {
      return { student_id: match[1], name: match[2].trim() }
    } else {
      return { name: line, student_id: null }
    }
  })
  
  try {
    const res = await fetch('/api/students/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    })
    
    if (res.ok) {
      importNames.value = ''
      showImportModal.value = false
      emit('show-toast', `成功导入 ${students.length} 名学生！`, 'success')
      emit('refresh')
    }
  } catch (e) {
    emit('show-toast', '导入失败', 'error')
  }
}

const clearAllStudents = () => {
  deleteTargetId.value = null // Mark as 'Clear All' action
  deleteModalContent.value = {
    title: '⚠️ 确认清空',
    message: '确定要清空所有学生数据吗？<br>此操作<b>无法撤销</b>，所有考勤和分数记录都将丢失。',
    btnText: '确认清空',
    btnClass: 'delete-confirm-btn'
  }
  showDeleteModal.value = true
}

const executeDeleteAction = async () => {
  if (deleteTargetId.value) {
    // Single Delete
    emit('delete-student', deleteTargetId.value)
    showDeleteModal.value = false
  } else {
    // Clear All
    try {
      const res = await fetch('/api/students/all', { method: 'DELETE' })
      if (res.ok) {
        showDeleteModal.value = false
        emit('show-toast', '已清空所有学生', 'success')
        emit('refresh')
      } else {
        emit('show-toast', '清空失败: 服务器返回错误', 'error')
      }
    } catch (e) {
      console.error(e)
      emit('show-toast', '清空失败: 网络错误', 'error')
    }
  }
}
</script>

<template>
  <div class="glass-panel student-list-container">
    <div class="header">
      <h3>点名册 <span>({{ students.length }})</span></h3>
      <div class="header-actions">
        <button type="button" class="import-btn-small" @click="showImportModal = true" title="批量导入">导入</button>
        <button type="button" class="clear-btn-small" @click="clearAllStudents" title="清空所有学生">清空</button>
      </div>
    </div>
    
    <div class="add-form">
      <input 
        v-model="newStudentName" 
        @keyup.enter="addStudent" 
        type="text" 
        placeholder="输入姓名添加..." 
      />
      <button @click="addStudent" class="add-btn">添加</button>
    </div>

    <ul class="student-list">
      <li v-for="student in students" :key="student.id" class="student-item" :class="{ absent: student.status === 'absent' }">
        <div class="left-section">
          <label class="check-container" title="签到状态: 勾选为出勤">
             <input 
               type="checkbox" 
               :checked="student.status !== 'absent'"
               @change="$emit('toggle-status', student.id, student.status || 'present')"
             >
             <span class="checkmark"></span>
          </label>
          <span class="name">{{ student.name }}</span>
        </div>
        
        <div class="actions">
          <span class="tag score" title="平时分">{{ student.score || 0 }}分</span>
          <span class="tag count" title="被点名次数">{{ student.selection_count }}次</span>
          <button @click="deleteStudent(student.id)" class="btn-delete" title="删除">×</button>
        </div>
      </li>
      <li v-if="students.length === 0" class="empty-state">
        暂无学生，请在上方添加。
      </li>
    </ul>


    <!-- Import Modal -->
    <!-- Import Modal -->
    <!-- Import Modal -->
    <Teleport to="body">
      <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
        <div class="modal-content">
          <h4>批量导入学生</h4>
          <p class="hint">每行输入一个学生。支持格式：<br>1. 仅名字（如：张三）<br>2. 学号+空格+名字（如：2023001 张三）</p>
          <textarea 
            v-model="importNames" 
            placeholder="20230101 张三&#10;李四"
            rows="10"
          ></textarea>
          <div class="modal-actions">
             <button @click="showImportModal = false">取消</button>
             <button class="confirm-btn" @click="handleBatchImport">确认导入</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Generic Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content confirm-modal">
          <h4>{{ deleteModalContent.title }}</h4>
          <p class="warning-text" v-html="deleteModalContent.message"></p>
          <div class="modal-actions">
             <button @click="showDeleteModal = false">取消</button>
             <button :class="deleteModalContent.btnClass" @click="executeDeleteAction">{{ deleteModalContent.btnText }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.student-list-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: var(--border-radius, 16px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  width: 100%;
  height: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.6);
  position: relative;
  z-index: 10;
}

.header {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 700;
}

h3 span {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.add-form {
  display: flex;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.add-form input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-form input:focus {
  border-color: var(--primary-color, #6f42c1);
  box-shadow: 0 0 0 3px rgba(111, 66, 193, 0.1);
}

.add-btn {
  background: var(--primary-color, #6f42c1);
  color: white;
  border: none;
  padding: 0 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.add-btn:hover {
  background: var(--primary-hover, #5a32a3);
}

.student-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  overflow-y: auto;
  flex: 1;
  min-height: 0; /* Prevent flex overflow */
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.student-list::-webkit-scrollbar {
  width: 6px;
}
.student-list::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.student-item:last-child {
  border-bottom: none;
}

.student-item:hover {
  background: rgba(255,255,255,0.5);
}

.student-item.absent .name {
  text-decoration: line-through;
  color: #94a3b8;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.tag.score {
  background: #eff6ff;
  color: #3b82f6;
}

.tag.count {
  background: #f8fafc;
  color: #64748b;
}

.btn-delete {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.btn-delete:hover {
  color: #ef4444;
}

.empty-state {
  text-align: center;
  margin-top: 2rem;
  color: #94a3b8;
}

/* Checkbox */
.check-container {
  display: block;
  position: relative;
  padding-left: 20px;
  cursor: pointer;
  font-size: 20px;
  user-select: none;
}
.check-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 18px;
  width: 18px;
  background-color: #e2e8f0;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.check-container:hover input ~ .checkmark {
  background-color: #cbd5e1;
}
.check-container input:checked ~ .checkmark {
  background-color: var(--accent-green, #10b981);
}
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}
.check-container input:checked ~ .checkmark:after {
  display: block;
}
.check-container .checkmark:after {
  left: 6px;
  top: 3px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}


.import-btn-small {
  background: transparent;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}
.import-btn-small:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  gap: 10px; /* Add spacing between buttons */
}

.clear-btn-small {
  background: transparent;
  border: 1px dashed #ef4444;
  color: #ef4444;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  /* margin-left: 0.5rem; Remove margin, use gap in parent */
}
.clear-btn-small:hover {
  background: #fef2f2;
}

/* Modal Styles specific to this component */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}
h4 { margin: 0 0 0.5rem 0; color: #1e293b; }
.hint { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-family: inherit;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.modal-actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
}
.modal-actions .confirm-btn {
  background: var(--primary-color, #6f42c1);
  color: white;
  border: none;
}

.warning-text {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-actions .delete-confirm-btn {
  background: #ef4444; 
  color: white;
  border: none;
}
.modal-actions .delete-confirm-btn:hover {
  background: #dc2626;
}
</style>
