<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { teamApi, teamReceiveApi, refreshCommissionApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import confetti from "canvas-confetti";
import { useI18n } from "vue-i18n";
import { throttle } from "@/utils/throttle";
import coinImg from "@/assets/img/jinbi.png";
import LotteryPop from "./Lottery.vue";
import Rebate from "./Rebate.vue"
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();
const dataVal = ref([]);
const refreshIcon = ref(false)
const clickRefresh = async () => {
  refreshIcon.value = true
  try {
    const res = await refreshCommissionApi({})
    if (res.success) {
      infoVal.value.tomorrow_brokerage = res.data.tomorrow_team_brokerage
    }
  } catch (error) {

  }
  setTimeout(() => {
    refreshIcon.value = false
  }, 1000);
}
const infoVal = ref({
  can_receive_amount: "0.00",
  received_amount: "0.00",
  today_bet_amount: 0,
  today_direct_num: 0,
  today_team_num: 0,
  tomorrow_brokerage: "0.00",
  yestoday_brokerage: 0,
});
const awardPop = ref(false);
const loading = ref(true);

const geTteamApi = async () => {
  try {
    const res = await teamApi({});
    if (res.success) {
      dataVal.value = res.data.list;
      infoVal.value = res.data.info;
      setTimeout(() => {
        loading.value = false
      }, 500);
    }
  } catch (error) { }
};
// 领取
const geTteamApiVal = throttle(async () => {
  if (infoVal.value.can_receive_amount == 0) {
    message.error(t("invite0.i38"));
    return false;
  }
  message.info("Loading...", 1);
  try {
    const res = await teamReceiveApi({});
    if (res.success) {
      confetti({
        particleCount: 150,
        spread: 60,
      });
      awardPop.value = true;
    } else {
      message.error(res.message);
    }
  } catch (error) { }
}, 2000);

const closePop = () => {
  awardPop.value = false;
  geTteamApi();
};

const showPopover = ref(false);

// 通过 actions 属性来定义菜单选项
const actions = [
  { text: t('invite0.i43') },
];
const showRebate = ref(false)
const closeRebatePop = () => {
  showRebate.value = false
}
const gotoList = () => {
  // router.push("/Rebate");
  showRebate.value = true
};
onMounted(() => {
  geTteamApi()
})
</script>
<template>
  <!-- <van-skeleton :loading="loading">
    <template #template>
      <div class="gujia">
        <van-skeleton-image class="avatar_gujia" />
        <div class="content_gujia">
          <van-skeleton-paragraph />
        </div>
      </div>
    </template> -->
  <div class="pageInfo">
    <div class="avatat">
      <img :src="userStore.userInfo.avatar" alt="" />
    </div>
    <div class="page_box">
      <p style="height: 16px;"></p>
      <div class="info_data">
        <div class="item">
          <div class="item_title">
            <p>{{ $t("invite0.i25") }}</p>
            <p>{{ infoVal.today_bet_amount }}</p>
          </div>
          <div class="item_info">
            <div class="item_flex">
              <p>{{ $t("invite0.i37") }} <span>{{ infoVal.today_team_num }}</span></p>
            </div>
          </div>
        </div>
        <div class="item">
          <div class="item_title">
            <p>{{ $t("invite0.i27") }}</p>
            <p>{{ infoVal.yestoday_brokerage }}</p>
          </div>
          <div class="item_info">
            <p>{{ $t("invite0.i28") }}</p>
          </div>
        </div>
      </div>
      <div class="info_flexdiv">
        <div class="nowText">
          <p>{{ $t("invite0.i29") }}</p>
          <p>{{ infoVal.can_receive_amount }}</p>
        </div>
        <div class="nowText">
          <p>{{ $t("invite0.i51") }}</p>
          <div class="refresh">
            <p>{{ infoVal.tomorrow_brokerage }}</p>
            <van-icon @click="clickRefresh" :class="`${refreshIcon ? 'refreshIconAct' : ''}`" name="replay" />
          </div>
        </div>
        <p>{{ $t("invite0.i30") }} {{ infoVal.received_amount }}</p>
        <div class="btn" v-if="infoVal.can_receive_amount" @click="geTteamApiVal">{{ $t("invite0.i31") }}</div>
      </div>
    </div>
  </div>
  <p v-if="dataVal.length < 1" class="Instructions" @click="gotoList">{{ $t('invite0.i55') }}<van-icon
      style="margin: 0 0 0 4px;" color="#ee0a24" size="14" name="question-o" /></p>
  <div class="pageList" v-if="dataVal.length >= 1">
    <div class="flextitle">
      <p>{{ $t("invite0.i41") }}</p>
      <p class="Instructions" @click="gotoList">{{ $t('invite0.i55') }}<van-icon style="margin: 0 0 0 4px;"
          color="#ee0a24" size="14" name="question-o" /></p>
      <!-- <div class="flexItem">
        <p>{{ $t("invite0.i42") }} </p>
        <van-popover placement="top-end" v-model:show="showPopover" :actions="actions" actions-direction="horizontal">
          <template #reference>
            <van-icon name="question-o" />
          </template>
        </van-popover>
      </div> -->
    </div>
    <div class="listBox">
      <div class="item" v-for="(item, index) of dataVal" :key="index">
        <div class="item_avatar">
          <div class="rank">
            <svg xmlns="http://www.w3.org/2000/svg" width="33" height="33" viewBox="0 0 33 33" fill="none">
              <path
                d="M17.8333 30.8108C11.2059 30.8108 5.83333 26.4377 5.83333 21.0434C5.83333 18.2384 7.2859 15.7097 9.61219 13.9282C11.7598 12.2836 17.0333 9.32178 16.2333 2.81079C21.5 5.64404 27 8.64404 24.0333 18.0434C27.5 16.144 28.5 20.644 29.0333 17.8261C29.4648 18.8336 29.8333 19.9162 29.8333 21.0434C29.8333 26.4377 24.4607 30.8108 17.8333 30.8108Z"
                fill="white" fill-opacity="0.15" />
            </svg>
            <p>{{ index + 1 }}</p>
          </div>
          <img :src="item.avatar" alt="" />
          <p>{{ item.username }}</p>
        </div>
        <div class="item_amouont">
          <div class="bet_amount">
            <img :src="coinImg" alt="" />
            <p>{{ item.bet_amount }}</p>
          </div>
          <!-- <p class="brokerage">= ${{ item.brokerage }}</p> -->
        </div>
      </div>
    </div>
  </div>
  <van-popup v-model:show="showRebate" round>
    <div style="width: 90vw;background: #030616;">
      <Rebate @close="closeRebatePop" />
    </div>
  </van-popup>
  <LotteryPop v-if="awardPop" @close="closePop" :val="infoVal.can_receive_amount" />
  <!-- </van-skeleton> -->
</template>
<style lang="scss" scoped>
@import url("./index.scss");
</style>