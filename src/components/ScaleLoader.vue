<template>
    <div v-if="loading" class="scale-loader" :style="{ height: size + 'px' }">
        <div v-for="n in barCount" :key="n" class="bar" :style="{
            backgroundColor: color,
            height: size + 'px',
            animationDelay: (n * 0.1) + 's'
        }" />
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    loading: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#3FF100'
    },
    size: {
        type: Number,
        default: 40 // 高度，单位 px
    },
    barCount: {
        type: Number,
        default: 5
    }
});
</script>

<style scoped>
.scale-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.bar {
  width: 4px;
  transform-origin: center center; /* 👈 修复这里 */
  animation: scaleYAnim 1s infinite ease-in-out;
}

@keyframes scaleYAnim {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.4);
  }
}
</style>