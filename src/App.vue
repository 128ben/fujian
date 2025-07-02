<!-- App.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import Tabbar from "./components/Tabbar.vue";
import { useRoute, useRouter } from "vue-router";
import GuideAddToHomeScreen from "./components/GuideAddToHomeScreen.vue";
import { getPingApi } from "@/utils/api";
let pollInterval = null;
const route = useRoute()
const showGuide = ref(false); // 控制 GuideAddToHomeScreen 的显示状态
// import VConsole from 'vconsole';
// const vConsole = new VConsole();
// console.log('Hello world');

onMounted(() => {
  if (localStorage.getItem("token")) {
    pingFunction()
    startPolling()
  }
})
const startPolling = () => {
  pollInterval = setInterval(() => {
    pingFunction();
  }, 10000);
};

const pingFunction = async () => {
  try {
    // const res = await getPingApi({});
  } catch (error) {

  }
}
// 监听路由变化
// watch(
//   () => route.path,
//   (newPath) => {
//     if (!!localStorage.getItem("token")) {
//       // 如果跳转到 GamePages 或 PrimitiveGame 页面，隐藏 GuideAddToHomeScreen
//       if (newPath.includes("GamePages") || newPath.includes("PrimitiveGame")) {
//         showGuide.value = false;
//       } else {
//         showGuide.value = true;
//       }
//     }
//   },
//   { immediate: true } // 立即执行一次，确保初始状态正确
// );

// 缓存页面组件名（建议配合路由 name）
const cachedPages = ref(['ChartPage']);
</script>

<template>
  <!-- <router-view /> -->
  <!-- <GuideAddToHomeScreen v-if="showGuide" /> -->
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="cachedPages">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
  <Tabbar />
</template>

<style>
/* 字体引用 */
@font-face {
  font-family: 'Future Earth';
  src: url('@/assets/fonts/future-earth.ttf') format('truetype');
  /* 最后一种格式 */
  font-weight: normal;
  /* 指定字体的粗细 */
  font-style: normal;
  /* 指定字体的样式 */
  font-display: swap;
  /* 字体显示策略，优化字体加载体验 */
}
.showConfirmDialog-bai{
  background: #fff !important;
}
</style>