<template>
  <div v-if="showGuide" class="guide-content">
    <div class="close-btn" @click="closeGuide">×</div>
    <img :src="guideGif" alt="">
    <p @click="installPWA">{{ $t("home0.h19") }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from "vue-i18n";
import guideGif from '@/assets/img/guideGif.gif';
const { t } = useI18n();
const showGuide = ref(false);

// 判断设备类型
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function isRunningInPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// 监听 Android 的安装提示事件
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // 阻止默认的安装提示
  deferredPrompt = event; // 保存事件对象
});

// 安装 PWA 的逻辑
function installPWA() {
  if (isAndroid() && deferredPrompt) {
    // 触发 Android 的安装提示
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('用户已安装 PWA');
        localStorage.setItem('h5-add-to-home-installed', 'true'); // 记录已安装
        showGuide.value = false; // 隐藏引导按钮
      } else {
        console.log('用户取消了安装');
      }
      deferredPrompt = null; // 重置事件对象
    });
  } else if (isIOS()) {
    // 显示 iOS 的提示信息
    alert(t('home0.h17'));
    localStorage.setItem('h5-add-to-home-installed', 'true');
    // 隐藏引导按钮
    showGuide.value = false;
  } else {
    alert(t('home0.h18'));
  }
}

// 关闭引导并记录状态
const closeGuide = () => {
  showGuide.value = false;
  localStorage.setItem('h5-add-to-home-guide', 'closed'); // 记录用户关闭了引导按钮
};

// 初始化检测
onMounted(() => {
  if (isRunningInPWA()) {
    console.log('当前运行在 PWA 模式');
    showGuide.value = false; // 如果已经是 PWA 模式，不显示引导按钮
  } else {
    console.log('当前未运行在 PWA 模式');
    const isClosed = localStorage.getItem('h5-add-to-home-guide');
    const isInstalled = localStorage.getItem('h5-add-to-home-installed');

    if (!isInstalled) {
      // 如果未安装 PWA
      if (!isClosed) {
        // 如果用户没有关闭过引导按钮，显示引导按钮
        console.log("没有关闭过引导按钮，显示引导按钮");
        setTimeout(() => {
          showGuide.value = true;
        }, 2000);
      } else {
        // console.log("关闭过引导按钮，但未安装 PWA");
        // 如果用户关闭过引导按钮，但未安装 PWA，再次显示引导按钮
        // setTimeout(() => {
        //   showGuide.value = true;
        // }, 2000);
      }
    } else {
      // 如果已经安装 PWA，不显示引导按钮
      showGuide.value = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.guide-content {
  position: fixed;
  bottom: 16vw;
  z-index: 9;
  width: 90%;
  margin: 5%;
  border-radius: 10px;
  background: linear-gradient(180deg, #FFC327 0%, #F90 100%);
  box-shadow: 0px 2.889px 1.445px 0px rgba(0, 0, 0, 0.15), 0px -3.612px 0px 0px rgba(0, 0, 0, 0.25) inset;
  padding: 10px 8px;
  text-align: center;
  color: #fff;
  text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.25);
  font-size: 16px;
  font-weight: bold;
  animation: guide 2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 6vw;
    height: 6vw;
    margin: 0 0 8px 3px
  }

  img {
    width: 30px;
    height: 30px;
    margin: 0 4px 4px 0;
  }

  .flex {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.close-btn {
  position: absolute;
  top: -5px;
  right: 5px;
  font-size: 24px;
  cursor: pointer;
}
</style>