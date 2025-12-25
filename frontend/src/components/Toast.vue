<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'success' // 'success' | 'error' | 'info'
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)
let timer = null

onMounted(() => {
  // Trigger animation
  setTimeout(() => {
    isVisible.value = true
  }, 10)
  
  // Auto close
  timer = setTimeout(() => {
    close()
  }, props.duration)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 300) // Wait for exit animation
}
</script>

<template>
  <div class="toast" :class="[type, { visible: isVisible }]" @click="close">
    <span class="icon">
      <template v-if="type === 'success'">✓</template>
      <template v-else-if="type === 'error'">✕</template>
      <template v-else>ℹ</template>
    </span>
    <span class="message">{{ message }}</span>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  background: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  max-width: 320px;
}

.toast.visible {
  opacity: 1;
  transform: translateX(0);
}

.icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast.success .icon {
  background: #dcfce7;
  color: #166534;
}

.toast.error .icon {
  background: #fee2e2;
  color: #991b1b;
}

.toast.info .icon {
  background: #dbeafe;
  color: #1e40af;
}

.message {
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
}
</style>
