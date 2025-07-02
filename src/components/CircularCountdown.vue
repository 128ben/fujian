<template>
  <!-- 模板部分保持不变 -->
  <div class="circular-countdown" :style="{ width: size, height: size }">
    <svg class="circular-countdown-svg" viewBox="0 0 100 100">
      <circle class="circular-countdown-bg" cx="50" cy="50" :r="radius" :stroke="backgroundColor"
        :stroke-width="strokeWidth" fill="none" />
      <path id="progress-path" class="circular-countdown-progress" :stroke="currentColor" :stroke-width="strokeWidth"
        fill="none" :stroke-dasharray="dashArray" :stroke-dashoffset="dashOffset" :style="progressStyle" d="
          M 50, 50
          m 0, -45
          a 45,45 0 1,0 0,90
          a 45,45 0 1,0 0,-90
        " />
    </svg>
    <div class="circular-countdown-content"
      :style="`width: calc(${size} - ${strokeWidth + 2}px);height: calc(${size} - ${strokeWidth + 2}px);`">
      <slot>
        {{ formattedTime }}
      </slot>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'CircularCountdown',
  props: {
    duration: {
      type: Number,
      default: 60
    },
    startTime: {
      type: Number,
      default: 0
    },
    autoStart: {
      type: Boolean,
      default: false
    },
    colors: {
      type: Array,
      default: () => [
        { percent: 0.66, color: '#4CAF50' }, // 绿色
        { percent: 0.33, color: '#FFC107' }, // 黄色
        { percent: 0, color: '#F44336' }    // 红色
      ]
    },
    backgroundColor: {
      type: String,
      default: '#e0e0e0'
    },
    strokeWidth: {
      type: Number,
      default: 8
    },
    size: {
      type: String,
      default: '120px'
    },
    showTime: {
      type: Boolean,
      default: true
    }
  },

  emits: ['finish', 'update:startTime', 'color-change'],

  setup(props, { emit }) {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const dashArray = `${circumference} ${circumference}`

    const timeLeft = ref(props.duration - props.startTime)
    const isRunning = ref(props.autoStart)
    const animationFrame = ref(null)
    const lastTimestamp = ref(null)
    const elapsedTime = ref(props.startTime)
    const currentColor = ref(props.colors[0]?.color || '#4CAF50')

    const progress = computed(() => {
      return Math.max(0, Math.min(1, timeLeft.value / props.duration))
    })

    const dashOffset = computed(() => {
      return circumference * (1 - progress.value)
    })

    const formattedTime = computed(() => {
      return Number(timeLeft.value.toFixed(0))
    })

    const progressStyle = computed(() => ({
      transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease'
    }))

    const updateColor = () => {
      const sortedColors = [...props.colors].sort((a, b) => b.percent - a.percent)
      const newColor = sortedColors.find(color => progress.value >= color.percent)?.color

      if (newColor && newColor !== currentColor.value) {
        currentColor.value = newColor
        emit('color-change', newColor)
      }
    }

    const animate = (timestamp) => {
      if (!lastTimestamp.value) {
        lastTimestamp.value = timestamp
      }

      const deltaTime = (timestamp - lastTimestamp.value) / 1000
      lastTimestamp.value = timestamp

      if (isRunning.value && timeLeft.value > 0) {
        elapsedTime.value += deltaTime
        timeLeft.value = Math.max(0, props.duration - elapsedTime.value)
        updateColor()

        if (timeLeft.value <= 0) {
          pause()
          emit('finish')
        }

        emit('update:startTime', elapsedTime.value)
        animationFrame.value = requestAnimationFrame(animate)
      }
    }

    const start = () => {
      if (!isRunning.value) {
        // if (timeLeft.value <= 0) {
        reset()
        // }
        isRunning.value = true
        lastTimestamp.value = null
        animationFrame.value = requestAnimationFrame(animate)
      }
    }

    const pause = () => {
      // console.log(6666);
      isRunning.value = false
      if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value)
        animationFrame.value = null
      }
    }

    const reset = () => {
      pause()
      timeLeft.value = props.duration
      elapsedTime.value = props.duration - props.startTime
      currentColor.value = props.colors[0]?.color || '#4CAF50'
      if (props.autoStart) {
        start()
      }
    }

    // 改进的 watch 逻辑
    watch(() => props.duration, (newDuration, oldDuration) => {
      // 计算比例并调整 elapsedTime
      const ratio = newDuration / oldDuration
      elapsedTime.value = elapsedTime.value * ratio
      timeLeft.value = newDuration - elapsedTime.value
      updateColor()

      // 如果计时器正在运行，需要重新启动动画以确保平滑过渡
      if (isRunning.value) {
        pause()
        start()
      }
    }, { immediate: true })

    watch(() => props.startTime, (newStartTime) => {
      // 直接设置已用时间并计算剩余时间
      elapsedTime.value = newStartTime
      timeLeft.value = props.duration - newStartTime
      updateColor()

      // 如果计时器正在运行，需要重新启动动画以确保平滑过渡
      if (isRunning.value) {
        pause()
        start()
      }
    }, { immediate: true })

    onMounted(() => {
      if (props.autoStart) {
        start()
      }
    })

    onUnmounted(() => {
      pause()
    })

    return {
      radius,
      dashArray,
      dashOffset,
      timeLeft,
      formattedTime,
      currentColor,
      progressStyle,
      start,
      pause,
      reset
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.circular-countdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.circular-countdown-svg {
  width: 100%;
  height: 100%;
}

.circular-countdown-bg {
  opacity: 0.3;
}

.circular-countdown-progress {
  stroke-linecap: round;
  transform: rotate(5deg);
  transform-origin: center;
  transition: stroke-dashoffset 0.1s linear, stroke 0.5s ease;
}

.circular-countdown-content {
  border-radius: 50%;
  /* overflow: hidden; */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 12px;
  font-weight: bold;
}
</style>