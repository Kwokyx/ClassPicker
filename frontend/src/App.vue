<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentList from './components/StudentList.vue'
import RouletteWheel from './components/RouletteWheel.vue'
import AttendanceModal from './components/AttendanceModal.vue'
import HistoryModal from './components/HistoryModal.vue'
import ToastContainer from './components/ToastContainer.vue'
import { launchConfetti } from './utils/confetti'

const students = ref([])
const isSpinning = ref(false)
const showAttendanceModal = ref(false)
const showHistoryModal = ref(false)
const winnerIndex = ref(null)
const winner = ref(null)
const showGrading = ref(false)
const currentMode = ref('random') // 'random' or 'fair'
const toastRef = ref(null)

// Toast helper
const showToast = (message, type = 'success') => {
  toastRef.value?.addToast(message, type)
}

// Computed: Filter out absent students
const activeStudents = computed(() => {
  return students.value.filter(s => s.status !== 'absent')
})

const fetchStudents = async () => {
  try {
    const res = await fetch('/api/students')
    students.value = await res.json()
  } catch (e) {
    console.error('获取学生列表失败', e)
  }
}

const addStudent = async (name) => {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (res.ok) {
    showToast('学生添加成功', 'success')
    fetchStudents()
  }
}

const deleteStudent = async (id) => {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
  if (res.ok) {
    showToast('学生已删除', 'success')
    fetchStudents()
  }
}

const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'absent' ? 'present' : 'absent'
  const res = await fetch(`/api/students/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  if (res.ok) fetchStudents()
}

const handleSpinStart = () => {
  spin(currentMode.value)
}

const spin = async (mode) => {
  if (isSpinning.value || activeStudents.value.length === 0) return
  
  isSpinning.value = true
  winner.value = null
  winnerIndex.value = null
  showGrading.value = false
  
  try {
    const res = await fetch('/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }) 
    })
    const data = await res.json()
    
    // Find index in ACTIVE students
    const index = activeStudents.value.findIndex(s => s.id === data.id)
    
    if (index !== -1) {
      winnerIndex.value = index
      winner.value = data
      
      // Record to history immediately (score_delta = null means pending)
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data.id,
          student_name: data.name,
          mode: currentMode.value,
          score_delta: null
        })
      })
      
      // Wait for animation (6s CSS + buffer)
      setTimeout(() => {
        isSpinning.value = false
        launchConfetti() // 🎉
        fetchStudents() // Update counts
        showGrading.value = true
      }, 6200)
    } else {
        isSpinning.value = false
        alert('后端选取了缺席学生，请刷新或检查后台逻辑')
    }
  } catch (e) {
    console.error(e)
    isSpinning.value = false
  }
}

const gradeStudent = async (scoreDelta) => {
  if (!winner.value) return
  const res = await fetch(`/api/students/${winner.value.id}/score`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta: scoreDelta })
  })
  if (res.ok) {
    // Update the history record with the score
    await fetch(`/api/history/${winner.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score_delta: scoreDelta })
    })
    
    showGrading.value = false
    winner.value = null
    fetchStudents()
  }
}


const markAttendance = async (isPresent) => {
  if (!winner.value) return
  
  // Update history with attendance result (special codes: 100=已到, -100=缺席)
  await fetch(`/api/history/${winner.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score_delta: isPresent ? 100 : -100 })
  })
  
  if (!isPresent) {
    // Mark as absent (Toggle 'present' -> 'absent')
    await toggleStatus(winner.value.id, 'present')
  }
  
  // Close panel
  showGrading.value = false
  winner.value = null
  fetchStudents()
}

onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <div class="app-layout">
    <!-- Toast Notifications -->
    <ToastContainer ref="toastRef" />
    
    <!-- Header -->
    <header class="app-header">
      <div class="brand">
        <svg class="brand-logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <!-- Graduation cap -->
          <path d="M24 8 L4 18 L24 28 L44 18 Z" fill="#6f42c1"/>
          <path d="M24 28 L24 38 L12 32 L12 22 L24 28" fill="#8b5cf6"/>
          <path d="M24 28 L24 38 L36 32 L36 22 L24 28" fill="#6f42c1"/>
          <!-- Tassel -->
          <line x1="40" y1="18" x2="40" y2="32" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="40" cy="34" r="3" fill="#f59e0b"/>
        </svg>
        <h1><span class="title-main">智问</span><span class="title-sub">课堂抽问系统</span></h1>
      </div>
      <div class="nav-links">
        <a href="#" class="active">首页</a>
        <!-- Placeholders for look -->
        <div class="tooltip-container">
          <a href="#" class="help-link">使用说明</a>
          <div class="tooltip-content">
            用于在课堂场景中，通过随机或指定方式选取学生，完成点名签到与提问互动的工具。通过随机或特定算法选择学生回答问题，保证公平性。
          </div>
        </div>
      </div>
    </header>

    <AttendanceModal 
      :show="showAttendanceModal"
      :students="students"
      @close="showAttendanceModal = false"
      @toggle-status="toggleStatus"
    />
    
    <HistoryModal 
      :show="showHistoryModal"
      @close="showHistoryModal = false"
    />

    <div class="main-content">
      <!-- Left: Wheel Stage -->
      <section class="stage-section">
        <div class="wheel-stage">
           <!-- Winner Overlay / Instructions -->
           <div class="status-msg" v-if="!isSpinning && !winner">
             点击转盘中心开始
           </div>
           
           <div class="winner-msg" v-if="winner && !isSpinning">
             恭喜 <span class="highlight">{{ winner.name }}</span> 同学！
           </div>

           <RouletteWheel 
             :candidates="activeStudents"
             :isSpinning="isSpinning"
             :winnerIndex="winnerIndex"
             @spin-start="handleSpinStart"
           />
           
            <!-- Grading Panel (Floating below wheel) -->
            <div v-if="showGrading" class="grading-bar-wrapper">
              <!-- Grading Buttons (Interactive/Fair Mode) -->
              <div class="grading-bar" v-if="currentMode !== 'rollCall'">
               <span>评价回答:</span>
               <button @click="gradeStudent(2)" class="grade-btn excellent">优秀 (+2)</button>
               <button @click="gradeStudent(1)" class="grade-btn good">良好 (+1)</button>
               <button @click="gradeStudent(0)" class="grade-btn pass">合格 (+0)</button>
               <button @click="gradeStudent(-1)" class="grade-btn fail">未答 (-1)</button>
             </div>

              <!-- Attendance Buttons (Roll Call Mode) -->
              <div class="grading-bar" v-if="currentMode === 'rollCall'">
                 <span>{{ winner.name }} 到课确认:</span>
                 <button @click="markAttendance(true)" class="grade-btn excellent">已到</button>
                 <button @click="markAttendance(false)" class="grade-btn fail">缺席</button>
              </div>
            </div>

        </div>
      </section>

      <!-- Right: Sidebar -->
      <aside class="sidebar-section">
        <!-- Mode Tabs -->
        <div class="mode-tabs">
          <div class="mode-btn-wrapper">
            <button 
              :class="{ active: currentMode === 'random' }" 
              @click="currentMode = 'random'"
              data-tooltip="完全随机抽取，所有学生概率相等"
            >
              随机模式
            </button>
          </div>
          <div class="mode-btn-wrapper">
            <button 
              :class="{ active: currentMode === 'fair' }" 
              @click="currentMode = 'fair'"
              data-tooltip="优先抽取被点名次数少的学生，确保每人都有机会"
            >
              公平模式
            </button>
          </div>
          <div class="mode-btn-wrapper">
            <button 
              :class="{ active: currentMode === 'rollCall' }" 
              @click="currentMode = 'rollCall'"
              data-tooltip="随机抽取学生进行签到"
            >
              签到模式
            </button>
          </div>
        </div>

        <div class="sidebar-actions">
           <button class="sidebar-btn" @click="showAttendanceModal = true">
             考勤表
           </button>
           <button class="sidebar-btn" @click="showHistoryModal = true">
             历史记录
           </button>
        </div>

        <!-- Student List -->
        <div class="list-wrapper">
          <StudentList 
            :students="students" 
            @add-student="addStudent"
            @delete-student="deleteStudent"
            @toggle-status="toggleStatus"
            @refresh="fetchStudents"
            @show-toast="showToast"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: transparent;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.title-main {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6f42c1, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-sub {
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
}

.brand-logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.logo {
  font-size: 2rem;
}

.badge {
  background: var(--primary-color, #6f42c1);
  color: white;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 4px;
  vertical-align: middle;
}

.nav-links a {
  text-decoration: none;
  color: #64748b;
  margin-left: 2rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a.active, .nav-links a:hover {
  color: var(--primary-color, #6f42c1);
}

.main-content {
  flex: 1;
  display: flex;
  padding: 1rem 2rem;
  gap: 3rem;
  overflow: visible; /* Allow absolute elements (like winner msg) to extend outside */
  min-height: 0; /* Prevent flex item from growing beyond parent */
}

/* Stage */
.stage-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.wheel-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative; /* For absolute positioning of grading bar */
  transform: translateY(-30px); /* Move wheel up slightly as requested */
}

.status-msg, .winner-msg {
  font-size: 1.5rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 1.5rem;
  height: 2rem; 
  position: absolute;
  top: -100px;
}

.winner-msg {
  color: #1e293b;
  animation: slideDown 0.5s ease-out;
}

.highlight {
  color: var(--primary-color, #6f42c1);
  font-size: 2rem;
  margin: 0 0.5rem;
}

/* Sidebar */
.sidebar-section {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0; /* Important for nested flex scrolling */
}

.sidebar-actions {
  display: flex;
  gap: 0.5rem;
}

.sidebar-btn {
  flex: 1;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.8rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.sidebar-btn:hover {
  background: #f8fafc;
  color: var(--primary-color, #6f42c1);
  border-color: var(--primary-color, #6f42c1);
}

.mode-tabs {
  display: flex;
  background: rgba(255,255,255,0.6);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.5);
}

.mode-tabs button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
}

.mode-tabs button.active {
  background: white;
  color: var(--primary-color, #6f42c1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Tooltip Wrapper for Mode Buttons */
.mode-btn-wrapper {
  position: relative;
  flex: 1;
  display: flex;
}

.mode-btn-wrapper button[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 41, 59, 0.95);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  pointer-events: none;
}

.list-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0; /* Crucial for internal scrolling */
}

/* Grading Bar */
.grading-bar-wrapper {
  position: absolute;
  top: 100%; /* Below the wheel */
  margin-top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  display: flex;
  justify-content: center;
  animation: slideUp 0.3s ease-out;
  z-index: 100;
}

.grading-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.grading-bar span {
  font-weight: 600;
  color: #64748b;
  margin-right: 0.5rem;
}

.grade-btn {
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
}

.grade-btn:hover { transform: scale(1.05); }

.grade-btn.excellent { background: var(--accent-green, #10b981); }
.grade-btn.good { background: var(--accent-blue, #3b82f6); }
.grade-btn.pass { background: var(--accent-yellow, #f59e0b); }
.grade-btn.fail { background: var(--accent-red, #ef4444); }

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
    overflow-y: auto;
    height: auto;
  }
  
  .sidebar-section {
    width: 100%;
    height: 500px; /* fixed height for mobile list */
  }
  
  .app-layout {
    height: auto;
  }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* Tooltip Styles */
.tooltip-container {
  position: relative;
  display: inline-block;
}

.help-link {
  text-decoration: none;
  color: #64748b;
  margin-left: 2rem;
  font-weight: 500;
  transition: color 0.2s;
  cursor: help;
}

.help-link:hover {
  color: var(--primary-color, #6f42c1);
}

.tooltip-content {
  visibility: hidden;
  width: 300px;
  background-color: rgba(30, 41, 59, 0.95);
  color: #fff;
  text-align: left;
  border-radius: 8px;
  padding: 1rem;
  position: absolute;
  z-index: 1000;
  top: 150%;
  right: 0;
  opacity: 0;
  transition: opacity 0.3s;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  line-height: 1.6;
}

.tooltip-content::after {
  content: "";
  position: absolute;
  bottom: 100%;
  right: 20px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent transparent rgba(30, 41, 59, 0.95) transparent;
}

.tooltip-container:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
}
</style>
