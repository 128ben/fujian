<template>
    <div class="videoBox">
      <video
        ref="videoPlayer"
        class="video-js vjs-default-skin"
        controls
        preload="auto"
        width="640"
        height="360"
      >
        <source :src="videoSrc" type="application/x-mpegURL" />
      </video>
      <a href="https://cdn4.skygo.mn/live/disk1/BBC_News/HLSv3-FTA/BBC_News.m3u8" target="_blank" rel="noopener noreferrer">{{$t('home0.h16')}}</a>
    </div>
  </template>
  
  <script>
  import { onMounted, ref,onBeforeUnmount  } from 'vue';
  import videojs from 'video.js';
  import 'video.js/dist/video-js.css';

  export default {
    props: {
      videoSrc: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const videoPlayer = ref(null);
      let player = null;
  
      onMounted(() => {
        // 初始化 Video.js 播放器
        player = videojs(videoPlayer.value, {
          controls: true,
          autoplay: false,
          preload: 'auto',
        });
  
        // 销毁播放器以防内存泄漏
        player.src({ src: props.videoSrc, type: 'application/x-mpegURL' });
        // 在组件销毁时，销毁播放器
        onBeforeUnmount(() => {
          if (player) {
            console.log("销毁播放器");
            player.dispose();
          }
        });
      });
  
      return {
        videoPlayer,
      };
    },
  };
  </script>
  
  <style scoped>
  .videoBox{
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin: 10px auto;
  }
  .video-js {
    width: 90%;
    height: 200px;
    border-radius: 10px;
    overflow: hidden;
  }
  </style>