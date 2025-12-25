<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  candidates: {
    type: Array,
    required: true
  },
  isSpinning: {
    type: Boolean,
    default: false
  },
  winnerIndex: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['spin-start'])

const currentRotation = ref(0) 

// Vibrant Palette from suijizhuanpan.cn
const colors = [
  '#FF6B6B', // Red/Pink
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#FF9F1C', // Orange
  '#6f42c1', // Purple
  '#2EC4B6', // Cyan
  '#E71D36', // Deep Red
  '#8E44AD'  // Purple
]

const size = 600 // Internal SVG coordinate space size
const center = size / 2
const radius = size / 2 - 20 

// Helper to calculate SVG path for a segment
const getSectorPath = (startAngle, endAngle) => {
  const start = polarToCartesian(center, center, radius, endAngle)
  const end = polarToCartesian(center, center, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    'M', center, center,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ')
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

const segments = computed(() => {
  if (!props.candidates || props.candidates.length === 0) return []
  const count = props.candidates.length
  const anglePerItem = 360 / count
  
  return props.candidates.map((student, index) => {
    // Current segment start/end
    const startAngle = index * anglePerItem
    const endAngle = (index + 1) * anglePerItem
    
    // Text Position (Midpoint)
    const midAngle = startAngle + anglePerItem / 2
    const textRadius = radius * 0.7 
    const textPos = polarToCartesian(center, center, textRadius, midAngle)
    
    return {
      text: student.name,
      color: colors[index % colors.length],
      path: getSectorPath(startAngle, endAngle), 
      rotation: midAngle + 90, // Text rotation to align with spoke
      textX: textPos.x,
      textY: textPos.y
    }
  })
})

const spinTo = (index) => {
  if (index === null) return
  
  const count = props.candidates.length
  const anglePerItem = 360 / count
  
  // Target: segment `index` should be at Top (0 deg visual)
  const segmentCenter = (index + 0.5) * anglePerItem
  const currentMod = currentRotation.value % 360
  const targetMod = (360 - segmentCenter) % 360
  
  let diff = targetMod - currentMod
  if (diff < 0) diff += 360
  
  // Add spins
  const extraSpins = 8 * 360 
  currentRotation.value += diff + extraSpins
}

watch(() => props.winnerIndex, (val) => {
  if (props.isSpinning && val !== null) {
    spinTo(val)
  }
})

const handleCenterClick = () => {
  if (!props.isSpinning && props.candidates.length > 0) {
    emit('spin-start')
  }
}
</script>

<template>
  <div class="roulette-container">
    <!-- Pointer -->
    <div class="pointer"></div>
    
    <!-- Wheel -->
    <div class="wheel-wrapper">
      <svg 
        :viewBox="`0 0 ${size} ${size}`" 
        width="100%" 
        height="100%"
        shape-rendering="geometricPrecision"
        text-rendering="geometricPrecision"
      >
        <!-- Rotating Group -->
        <g 
          :style="{ 
            transform: `rotate(${currentRotation}deg)`,
            transformOrigin: 'center',
            transition: isSpinning ? 'transform 6s cubic-bezier(0.2, 0.8, 0.1, 1)' : 'none',
            willChange: 'transform'
          }"
        >
           <g v-for="(seg, i) in segments" :key="i">
             <path :d="seg.path" :fill="seg.color" stroke="white" stroke-width="2" stroke-linejoin="round" />
             <text
               :x="seg.textX"
               :y="seg.textY"
               fill="white" 
               font-size="24"
               font-weight="bold"
               text-anchor="middle"
               dominant-baseline="middle"
               :transform="`rotate(${seg.rotation}, ${seg.textX}, ${seg.textY})`"
               style="text-shadow: 0 1px 2px rgba(0,0,0,0.1);"
             >
               {{ seg.text }}
             </text>
           </g>
        </g>
        
        
        <!-- White Border Ring -->
        <circle 
          :cx="center" 
          :cy="center" 
          :r="size/2 - 10" 
          fill="none" 
          stroke="white" 
          stroke-width="20" 
        />
        
        <!-- Decorative Inner Shadow Ring -->
        <circle 
          :cx="center" 
          :cy="center" 
          :r="size/2 - 20" 
          fill="none" 
          stroke="rgba(0,0,0,0.1)" 
          stroke-width="2" 
        />
      </svg>
    </div>
    
    <!-- Center Button -->
    <button 
      class="center-btn" 
      @click="handleCenterClick"
      :disabled="isSpinning || candidates.length === 0"
    >
      <span v-if="!isSpinning">开始</span>
      <span v-else>...</span>
    </button>
  </div>
</template>

<style scoped>
.roulette-container {
  position: relative;
  width: 100%;
  max-width: 600px; /* Responsive max size */
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 50px;
  background-color: #333;
  clip-path: polygon(50% 100%, 0 0, 100% 0);
  z-index: 20;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}

.wheel-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  /* border: 10px solid white; Removed to use SVG border */
}

.center-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: var(--primary-color, #6f42c1);
  color: white;
  border: 4px solid white;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s, background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.center-btn:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.1);
  background: var(--primary-hover, #5a32a3);
}

.center-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: translate(-50%, -50%);
}
</style>
