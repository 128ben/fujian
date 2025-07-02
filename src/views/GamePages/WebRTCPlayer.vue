<template>
  <div class="notice-bar" v-if="noticeShow">
    <van-icon name="close" @click="closeNotice" />
    <van-notice-bar speed="30" scrollable :text="$t('game0.g40')" />
  </div>
  <div id="preview" @click="openPlayerFun">
    <div class="wmk">{{ locationHost }}</div>
  </div>
  <div class="playerFun" v-if="isShow">
    <div class="pause">
      <van-icon v-if="pause" name="play-circle-o" @click="resumeAction" />
      <van-icon v-else name="pause-circle-o" @click="pauseAction" />
    </div>
    <div class="cutUrl">
      <p :class="avtiveUrl == 0 ? 'act' : ''" @click="changUrl(540, 0)">
        540P
      </p>
      <p :class="avtiveUrl == 1 ? 'act' : ''" @click="changUrl(720, 1)">
        720P
      </p>
      <p :class="avtiveUrl == 2 ? 'act' : ''" @click="changUrl(1080, 2)">
        1080P
      </p>
    </div>
    <van-icon name="expand-o" @click="fullScreenAction" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from "vue";
const pause = ref(false);
const locationHost = ref(location.host)
const props = defineProps({
  liveUrl: String,
});
const isShow = ref(true);
const openPlayerFun = () => {
  isShow.value = true;
  setTimeout(() => {
    isShow.value = false;
  }, 3000);
};
// 创建播放客户端
console.log(HWLLSPlayer)
const playClient = HWLLSPlayer.createClient();
HWLLSPlayer.setParameter("AUTO_DOWNGRADE", false);
const streamUrl = ref(props.liveUrl);
const spinning = ref(true);

// 模拟加载时间
setTimeout(() => {
  spinning.value = false;
  isShow.value = false;
}, 3000);

// 播放
const startPlay = (url) => {
  playClient.startPlay(url, {
    elementId: "preview",
    showLoading: true,
    muted: false,
    autoPlay: true
  });
};
// 暂停
const pauseAction = () => {
  pause.value = true;
  playClient.pause();
};
// 恢复
const resumeAction = () => {
  pause.value = false;
  playClient.resume();
};
const avtiveUrl = ref(0);
const changUrl = (val, i) => {
  spinning.value = true;
  avtiveUrl.value = i;
  streamUrl.value = streamUrl.value.replace(/(\d{3,4})p$/, `${val}p`);
  playClient.destroyClient();
  startPlay(streamUrl.value);
  setTimeout(() => {
    spinning.value = false;
  }, 1000);
  isShow.value = false;
};
// 销毁
const destroyAction = () => {
  if (playClient) {
    playClient.destroyClient();
    console.log("已销毁");
  }
};

// 组件挂载后开始播放
onMounted(() => {
  HWLLSPlayer.setParameter('LOADING_CONFIG', {
    netQualityLoading: true, // 根据网络质量展示loading
    netQualityLoadingThreshold: 5, // 展示loading的阈值，默认为5
    frameStuckLoading: true, // 根据帧卡顿时长展示loading
    frameStuckThreshold: 50, // 帧卡顿时长阈值，单位为100ms，10表示1000ms
  })

  startPlay(streamUrl.value);
});
// 全屏
const fullScreenAction = function () {
  playClient.fullScreenToggle();
};

// 组件卸载前销毁播放器
onBeforeUnmount(() => {
  destroyAction();
});
const noticeShow = ref(true)
const closeNotice = () => {
  noticeShow.value = false
}
</script>

<style lang="scss" scoped>
#preview {
  width: 100%;
  height: 220px;
  position: relative;

  .wmk {
    position: absolute;
    bottom: 1vw;
    right: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    width: max-content;
    z-index: 1;
    font-size: 11px;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.notice-bar {
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.2);

  i {
    position: absolute;
    right: 2vw;
    z-index: 3;
  }

  .van-notice-bar {
    background: none;
    color: #fff;
  }

  :deep(.van-notice-bar__content) {
    font-weight: bold;
  }
}

.playerFun {
  position: absolute;
  z-index: 3;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;

  i {
    font-size: 22px;
  }

  .cutUrl {
    display: flex;
    align-items: center;

    p {
      margin: 0 8px;
      background: rgba(0, 0, 0, 0.8);
      padding: 2px 4px;
      border-radius: 4px;
    }

    .act {
      background: #fff;
      color: #000;
    }
  }
}

@media screen and (max-width: 321px) {
  #preview {
    height: 180px;
  }
}

@media screen and (min-width: 410px) {
  #preview {
    .wmk {
      right: 4vw;
      bottom: .2vw;
    }
  }
}
</style>