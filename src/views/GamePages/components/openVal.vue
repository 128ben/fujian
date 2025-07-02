<script lang="ts" setup>
import { ref, onMounted, defineProps, nextTick, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { gamePeriodLogApi, playbackApi } from "@/utils/api";
import { fnLineChart } from "@/components/Line";
import Marbles1 from "@/assets/img/Marbles1.png";
import Marbles2 from "@/assets/img/Marbles2.png";
import Marbles2s from "@/assets/img/Marbles2s.png";
import Marbles3 from "@/assets/img/Marbles3.png";
import Marbles4 from "@/assets/img/Marbles4.png";
import Marbles5 from "@/assets/img/Marbles5.png";
import Marbles6 from "@/assets/img/Marbles6.png";
import Marbles7 from "@/assets/img/Marbles7.png";
import Marbles8 from "@/assets/img/Marbles8.png";
import Marbles9 from "@/assets/img/Marbles9.png";
import Marbles10 from "@/assets/img/Marbles10.png";
import { message } from "ant-design-vue";
const { t } = useI18n();
const route = useRoute();
const props = defineProps({
  gameCode: String,
});
const MarblesMap = {
  1: Marbles1,
  2: props.gameCode !='town' ? Marbles2s : Marbles2,
  3: Marbles3,
  4: Marbles4,
  5: Marbles5,
  6: Marbles6,
  7: Marbles7,
  8: Marbles8,
  9: Marbles9,
  10: Marbles10,
};
const spinning = ref<boolean>(true);
const active = ref(1);
const betList = ref([]);
const trendList = ref([]);
const firstChars = ref([]);

const getData = async () => {
  try {
    const res = await gamePeriodLogApi({
      pageIndex: 1,
      pageSize: 100,
      game_code: props.gameCode,
      type: active.value
    });
    if (res.success) {
      betList.value = res.data.list;
      spinning.value = false;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
const upDataVal = ref(true)
const getTrend = async (val: number) => {
  upDataVal.value = false
  try {
    const res = await gamePeriodLogApi({
      pageIndex: 1,
      pageSize: 10,
      game_code: props.gameCode,
    });
    if (res.success) {
      upDataVal.value = true
      trendList.value = res.data.list;
      firstChars.value = trendList.value.map(
        (item) => item.result.split(",")[val]
      );
      nextTick(() => {
        let eleDots = document.querySelectorAll(".labelNum");
        fnLineChart(eleDots);
      });
    }
  } catch (error) { }
};
const rankingVal = ref(0)
const rankingList = ref([
  { text: t("game0.g35"), value: 0 },
  { text: t("game0.g41"), value: 1 },
  { text: t("game0.g42"), value: 2 },
])
const tabChange = (i) => {
  spinning.value = true;
  active.value = i;
  if (i == 2) {
    getTrend(0);
  } else {
    getData();
  }
  setTimeout(() => {
    spinning.value = false;
  }, 500);
  // date.value = formatDate(new Date());
};
const changVal = (e) => {
  getTrend(e)
}

onMounted(() => {
  getData();
});
let player = null;
const playback = ref(false)
const openPlayBack = () => {
  playback.value = true
  nextTick(() => {
    player = videojs('my-video');
    player.play();
  });
}
const videoTitle = ref("")
const videoUrl = ref("")
const videoLoading = ref(null)
const lookVideo = async (val) => {
  videoLoading.value = val.expect
  videoTitle.value = val.game_code + val.expect
  try {
    const res = await playbackApi({
      game_code: val.game_code,
      expect: val.expect,
    })
    if (res.success) {
      videoUrl.value = res.data.url
      videoLoading.value = null
      openPlayBack()
    }
  } catch (error) {

  }
}
const closeModal = () => {
  playback.value = false;
  if (player) {
    player.pause();
    player.currentTime(0); // 重置视频到开始
    player.dispose(); // 释放资源
    player = null;
    videoUrl.value = ""
  }
};

onBeforeUnmount(() => {
  if (player) {
    player.dispose(); // 组件销毁时释放资源
    videoUrl.value = ""
  }
});
</script>

<template>
  <div class="popBox">
    <div class="popHead">
      <!-- <p>{{ $t("game0.g38") }}</p> -->
      <div class="tab">
        <p :class="`btn ${active == 1 ? 'act' : ''}`" @click="tabChange(1)">
          {{ $t("game0.g38") }}
        </p>
        <p :class="`btn ${active == 2 ? 'act' : ''}`" @click="tabChange(2)">
          {{ $t("game0.g29") }}
        </p>
        <p :class="`btn ${active == 3 ? 'act' : ''}`" @click="tabChange(3)">
          {{ $t("game0.g45") }}
        </p>
        <p :class="`btn ${active == 4 ? 'act' : ''}`" @click="tabChange(4)">
          {{ $t("game0.g46") }}
        </p>
      </div>
    </div>
    <div v-if="active == 1">
      <a-spin :spinning="spinning">
        <div class="openVallist">
          <div class="item" v-for="(item, index) of betList" :key="index" @click="lookVideo(item)">
            <p>{{ item.expect }}</p>
            <div v-if="item.status != 0 && item.status != -1">
              <van-icon size="20" name="play-circle-o" v-if="videoLoading != item.expect" />
              <van-loading size="20" type="spinner" v-if="videoLoading == item.expect" />
            </div>
            <div class="numberRow">
              <div class="itemNumber" v-for="(icon, i) in item.result.split(',')" :key="i">
                <img :src="MarblesMap[icon]" v-if="icon" alt="" />
                <p v-if="!icon && item.status != -1">{{ $t("game0.g39") }}</p>
                <p v-if="!icon && item.status == -1">{{ $t("game0.g9") }}</p>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
    <div v-if="active == 2">
      <div class="trendVal">
        <van-dropdown-menu>
          <van-dropdown-item @change="changVal" v-model="rankingVal" :options="rankingList" />
        </van-dropdown-menu>
      </div>
      <div class="trendlist" v-if="upDataVal">
        <div class="item" v-for="(item, index) of trendList" :key="index">
          <p>{{ item.expect }}</p>
          <div class="numberRow">
            <div class="itemNumbers" v-for="(num, i) of trendList.length" :key="i"
              :class="{ labelNum: num.toString() === firstChars[index] }">
              <p>{{ num }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="loadingBox" v-else>
        <p>Loading...</p>
      </div>
    </div>
    <div v-if="active == 3">
      <a-spin :spinning="spinning">
        <div class="openVallist">
          <div class="item" v-for="(item, index) of betList" :key="index" @click="lookVideo(item)">
            <p>{{ item.expect }}</p>
            <div v-if="item.status != 0 && item.status != -1">
              <van-icon size="20" name="play-circle-o" v-if="videoLoading != item.expect" />
              <van-loading size="20" type="spinner" v-if="videoLoading == item.expect" />
            </div>
            <div class="numberRow flexWrap">
              <p v-if="item.playing_type.length < 1">
                {{ item.status === -1 ? $t("game0.g9") : $t("game0.g39") }}
              </p>
              <div class="itemNumber" v-for="(icon, i) of item.playing_type" :key="i">
                <p :style="icon.type == 1 ? 'color:red' : ''">{{ icon.val }}</p>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
    <div v-if="active == 4">
      <a-spin :spinning="spinning">
        <div class="openVallist">
          <div class="item" v-for="(item, index) of betList" :key="index" @click="lookVideo(item)">
            <p>{{ item.expect }}</p>
            <div v-if="item.status != 0 && item.status != -1">
              <van-icon size="20" name="play-circle-o" v-if="videoLoading != item.expect" />
              <van-loading size="20" type="spinner" v-if="videoLoading == item.expect" />
            </div>
            <div class="numberRow flexWrap">
              <p v-if="item.playing_type.length < 1">
                {{ item.status === -1 ? $t("game0.g9") : $t("game0.g39") }}
              </p>
              <div class="itemNumber" v-for="(icon, i) of item.playing_type" :key="i">
                <p :style="icon.type == 1 ? 'color:red' : ''">{{ icon.val }}</p>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
    <van-dialog v-model:show="playback" :title="videoTitle" :confirmButtonText="$t('hint.h25')" @confirm="closeModal">
      <div class="videoBox">
        <video v-if="playback" id="my-video" class="video-js" controls preload="auto" data-setup="{}">
          <source :src="videoUrl" type="video/mp4" />
        </video>
      </div>
    </van-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>