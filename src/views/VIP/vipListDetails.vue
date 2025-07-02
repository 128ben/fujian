<script lang="ts" setup>
import { ref, onMounted, defineProps } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/useUserStore";
import { message } from "ant-design-vue";
import { getVipApi } from "@/utils/api";
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

const router = useRouter();
const loading = ref(false);
const vipList = ref([]);
const getVip = async () => {
  try {
    const res = await getVipApi({});
    if (res.success) {
      vipList.value = res.data.list;
    }
  } catch (error) { }
};
onMounted(() => {
  getVip();
});
const ruleList = ref([
  {
    title: "vip0.v17",
    text: "vip0.v18",
  },
  {
    title: "vip0.v19",
    text: "vip0.v20",
  },
  {
    title: "vip0.v21",
    text: "vip0.v22",
  },
  {
    title: "vip0.v23",
    text: "vip0.v24",
  },
]);
const goBack = () => {
  router.push("/VIP");
};
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t("vip0.v14") }}</p>
  </div>
  <div class="pages">
    <div class="title">
      <div class="line"></div>
      <p>{{ $t("vip0.v15") }}</p>
    </div>
    <div class="list">
      <div class="listTitle">
        <p>{{ $t("vip0.v16") }}</p>
        <p>{{ $t("vip0.v4") }}</p>
        <p>{{ $t("vip0.v5") }}</p>
        <p>{{ $t("vip0.v6") }}</p>
      </div>
      <div class="listbox">
        <div class="item" v-for="(item, index) of vipList" :key="index">
          <p>VIP {{ item.id }}</p>
          <p>{{ item.day_num_limit }}</p>
          <p>{{ item.amount_limit }}</p>
          <p>{{ item.day_amount_limit }}</p>
        </div>
      </div>
    </div>
    <div class="title">
      <div class="line"></div>
      <p>{{ $t("vip0.v15") }}</p>
    </div>
    <div class="rule">
      <div class="item" v-for="(item, index) of ruleList" :key="index">
        <p class="index">{{ index + 1 }}</p>
        <div class="text">
          <p>{{ $t(item.title) }}</p>
          <p>{{ $t(item.text) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.head {
  height: 44px;
  background: #0c1026;
  position: fixed;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;

  i {
    position: absolute;
    left: 10px;
  }
}

.pages {
  padding: 54px 10px;

  .title {
    display: flex;
    align-items: center;

    .line {
      width: 4px;
      height: 16px;
      margin: 0 6px 0 0;
      background: #636ff1;
    }

    p {
      font-weight: bold;
    }
  }

  .list {
    width: 100%;
    margin: 10px 0 20px;
    background: #0c1026;
    border-radius: 5px;
    overflow: hidden;

    .listTitle {
      display: flex;
      padding: 8px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      p {
        flex: 1;
        text-align: center;
        font-size: 14px;
        margin: 0 4px;
      }
    }

    .listbox {
      padding: 8px;

      .item {
        height: 40px;
        margin: 6px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;

        &:nth-child(odd) {
          background: #182234;
        }

        p {
          flex: 1;
          text-align: center;
          font-size: 12px;
        }
      }
    }
  }

  .rule {
    width: 100%;
    margin: 10px 0 0;
    padding: 10px;
    background: #0c1026;
    border-radius: 5px;
    overflow: hidden;

    .item {
      display: flex;
      margin: 10px 0 0;
      justify-content: space-between;

      .index {
        display: flex;
        width: 20px;
        height: 20px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        border-radius: 50%;
        background: #8dbbff;
      }

      .text {
        width: 90%;
        font-size: 14px;
        color: #788ca3;
        font-size: 12px;
        font-weight: 400;

        &>p:first-child {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px 0;
        }
      }
    }
  }
}
</style>