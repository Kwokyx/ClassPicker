<script setup>
import { ref } from 'vue'
import Toast from './Toast.vue'

const toasts = ref([])
let toastId = 0

const addToast = (message, type = 'success', duration = 3000) => {
  const id = toastId++
  toasts.value.push({ id, message, type, duration })
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Expose methods for parent components
defineExpose({ addToast })
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <Toast 
        v-for="toast in toasts" 
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}
</style>
