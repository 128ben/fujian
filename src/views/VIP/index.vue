<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/useUserStore";
import { message } from "ant-design-vue";
import { getVipApi } from "@/utils/api";
import vipListDetails from "./components/vipListDetails.vue";
import inviterAvatar from "@/assets/img/invite.png";
import crownImg from "@/assets/img/crown.png";
import vip0 from "@/assets/img/vip0.png";
import vip1 from "@/assets/img/vip1.png";
import vip2 from "@/assets/img/vip2.png";
import vip3 from "@/assets/img/vip3.png";
import vip4 from "@/assets/img/vip4.png";
import vip5 from "@/assets/img/vip5.png";
import vip6 from "@/assets/img/vip6.png";
import vip7 from "@/assets/img/vip7.png";
import vip8 from "@/assets/img/vip8.png";
import vip9 from "@/assets/img/vip9.png";
import vip10 from "@/assets/img/vip10.png";
import topVip0 from "@/assets/img/topVip0.png";
import topVip1 from "@/assets/img/topVip1.png";
import topVip2 from "@/assets/img/topVip2.png";
import topVip3 from "@/assets/img/topVip3.png";
import topVip4 from "@/assets/img/topVip4.png";
import topVip5 from "@/assets/img/topVip5.png";
import topVip6 from "@/assets/img/topVip6.png";
import topVip7 from "@/assets/img/topVip7.png";
import topVip8 from "@/assets/img/topVip8.png";
import topVip9 from "@/assets/img/topVip9.png";
import topVip10 from "@/assets/img/topVip10.png";
import vipfooter1 from "@/assets/svg/vipfooter1.svg";
import vipfooter2 from "@/assets/svg/vipfooter2.svg";
import vipfooter3 from "@/assets/svg/vipfooter3.svg";
import vipfooter4 from "@/assets/svg/vipfooter4.svg";

const store = useUserStore();
const vipImages = [
  vip0,
  vip1,
  vip2,
  vip3,
  vip4,
  vip5,
  vip6,
  vip7,
  vip8,
  vip9,
  vip10,
];
const topVipImages = [
  topVip0,
  topVip1,
  topVip2,
  topVip3,
  topVip4,
  topVip5,
  topVip6,
  topVip7,
  topVip8,
  topVip9,
  topVip10,
];
const router = useRouter();
const loading = ref(false);
const active = ref(0);
const vipInfo = ref({});
const vipList = ref([]);
const progressVal = ref(0);
const goBack = () => {
  router.push("/User");
};
const getVip = async () => {
  try {
    const res = await getVipApi({});
    if (res.success) {
      vipInfo.value = res.data.info;
      vipList.value = res.data.list;
      active.value = res.data.info.now;
      let now = res.data.info.now_bet;
      let total = res.data.info.next_bet;
      progressVal.value = total > 0 ? (now / total) * 100 : 0;
    }
  } catch (error) {}
};
onMounted(() => {
  getVip();
});
const openDetails = () => {
  router.push("/vipDetails");
};
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>VIP</p>
  </div>
  <div class="pages">
    <div class="vipTop">
      <div class="flex align full-width relative zIndex padding20">
        <div class="avatar">
          <img
            v-if="vipInfo.now != 0"
            class="crownImg"
            :src="crownImg"
            alt=""
          />
          <img class="inviterAvatar" :src="store.userInfo.avatar" alt="" />
        </div>
        <div class="userInfo">
          <p class="userName">{{ store.userInfo.username }}</p>
          <div class="topVIP">
            <img :src="topVipImages[vipInfo.now]" alt="" />
          </div>
        </div>
      </div>
      <img class="nowVip" :src="vipImages[vipInfo.now]" alt="" />
      <div class="vipProgress">
        <p>VIP {{ vipInfo.now }}</p>
        <a-progress strokeColor="#FEBE29" :percent="progressVal.toFixed(2)" />
        <p>VIP {{ vipInfo.next }}</p>
      </div>
      <p class="exaltText">
        {{ $t("vip0.v1") }}($) {{ vipInfo.now_bet }}/{{ vipInfo.next_bet }}
      </p>
    </div>
    <div class="vipInfoBox">
      <div class="btn" @click="openDetails">
        <p>{{ $t("vip0.v2") }}</p>
        <van-icon name="arrow" />
      </div>
      <div class="nowVIPInfo">
        <div class="flex_row">
          <p>{{ $t("vip0.v3") }}</p>
          <p>{{ $t("vip0.v4") }}</p>
          <p>{{ $t("vip0.v5") }}</p>
          <p>{{ $t("vip0.v6") }}</p>
        </div>
        <div class="flex_row" v-if="vipList.length > 1">
          <p>{{ vipList[vipInfo.now].id }}</p>
          <p>{{ vipList[vipInfo.now].day_num_limit }}</p>
          <p>{{ vipList[vipInfo.now].day_amount_limit }}</p>
          <p>{{ vipList[vipInfo.now].amount_limit }}</p>
        </div>
      </div>
      <div class="vipBanner">
        <p>{{ $t("vip0.v7") }}</p>
        <div>
          <van-tabs v-model:active="active" animated swipeable>
            <van-tab
              v-for="item of vipList"
              :title="'VIP ' + item.id"
              :key="item.id"
            >
              <div class="vipCard">
                <img class="bannerImgTop" :src="vipImages[item.id]" alt="" />
                <p class="title">VIP {{ item.id }}</p>
                <div
                  :class="`line ${
                    item.id === 0
                      ? 'backColor0'
                      : item.id <= 2
                      ? 'backColor1'
                      : item.id <= 4
                      ? 'backColor2'
                      : item.id <= 6
                      ? 'backColor3'
                      : 'backColor4'
                  }`"
                ></div>
                <div class="itemInfo">
                  <p>{{ $t("vip0.v8") }}</p>
                  <p>{{ item.bet_flow }}</p>
                </div>
              </div>
              <div class="vipInfoTetx">
                <div class="title">
                  <div class="line"></div>
                  <p>VIP {{ item.id }} {{ $t("vip0.v9") }}</p>
                </div>
                <div class="flexBox">
                  <div class="item">
                    <img :src="vipfooter1" alt="" />
                    <div>
                      <p>{{ $t("vip0.v10") }}</p>
                      <p>{{ item.day_num_limit }}</p>
                    </div>
                  </div>
                  <div class="item">
                    <img :src="vipfooter2" alt="" />
                    <div>
                      <p>{{ $t("vip0.v11") }}</p>
                      <p>{{ item.amount_limit }}</p>
                    </div>
                  </div>
                  <div class="item">
                    <img :src="vipfooter3" alt="" />
                    <div>
                      <p>{{ $t("vip0.v12") }}</p>
                      <p>{{ item.upgrade_award }}</p>
                    </div>
                  </div>
                  <div class="item">
                    <img :src="vipfooter4" alt="" />
                    <div>
                      <p>{{ $t("vip0.v13") }}</p>
                      <p>{{ item.day_amount_limit }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </van-tab>
          </van-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>