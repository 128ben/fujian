<script lang="ts" setup>
import { ref, onMounted, defineProps, nextTick } from "vue";
import { useRoute } from "vue-router";
import { gameOrderLogApi } from "@/utils/api";
import { Locale } from 'vant';
import { useUserStore } from "@/store/useUserStore";
import enUS from 'vant/es/locale/lang/en-US';
import zhCN from 'vant/es/locale/lang/zh-CN';
import ptBR from 'vant/es/locale/lang/pt-BR';
import arSA from 'vant/es/locale/lang/ar-SA';
const userStore = useUserStore();
if (userStore.lang == 'en') {
  Locale.use('en-US', enUS);
} else if (userStore.lang == 'zh') {
  Locale.use('zh-CN', zhCN);
} else if (userStore.lang == 'pt') {
  Locale.use('pt-BR', ptBR);
}else if (userStore.lang == 'ar') {
  Locale.use('ar-SA', arSA);
}

const spinning = ref<boolean>(true);
const props = defineProps({
  gameCode: String,
});
const active = ref(1);
const betList = ref([]);
const getData = async () => {
  try {
    const res = await gameOrderLogApi({
      pageIndex: 1,
      pageSize: 100,
      game_code: props.gameCode,
    });
    if (res.success) {
      betList.value = res.data.list;
      spinning.value = false;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const getMinDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
};
const formatDate = (date) => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};
const show = ref(false);
const minDate = ref(getMinDate());
const maxDate = ref(new Date());
const date = ref(formatDate(new Date()));

const onConfirm = (value) => {
  show.value = false;
  date.value = formatDate(value);
};
onMounted(() => {
  getData();
});

const valNum = ref(false);
const valNumList = ref([]);
const openValNum = (val) => {
  valNum.value = true;
  valNumList.value = val;
};
</script>

<template>
  <div class="popBox">
    <div class="popHead">
      <div class="tab">
        <p :class="`btn ${active == 1 ? 'act' : ''}`">
          {{ $t("game0.g28") }}
        </p>
      </div>
      <div class="date" @click="show = !show">
        <p>{{ date }}</p>
        <van-icon v-if="!show" name="arrow-down" />
        <van-icon v-else name="arrow-up" />
      </div>
    </div>
    <div class="list" v-if="active == 1">
      <div class="table">
        <div class="title">
          <p>{{ $t("game0.g30") }}</p>
          <p>{{ $t("game0.g31") }}</p>
          <p>{{ $t("game0.g20") }}</p>
          <p>{{ $t("game0.g32") }}</p>
          <p>{{ $t("game0.g33") }}</p>
        </div>
        <a-spin :spinning="spinning">
          <div class="tableTd">
            <div class="item_row" v-for="(item, index) of betList" :key="index">
              <p>{{ item.expect }}</p>
              <p>{{ item.bet_amount }}</p>
              <p class="lookVal" @click="openValNum(item.bet_content)">
                {{ $t("game0.g34") }}
              </p>
              <p :style="`color:${item.status_win == 0 ? 'red' : '#21FF04'}`">
                {{ item.win_amount }}
              </p>
              <p>{{ item.game_code }}</p>
              <div class="type" v-if="item.status == -1">{{ $t('game0.g9') }}</div>
            </div>
            <van-empty description="No data yet" v-if="betList.length < 1" />
          </div>
        </a-spin>
      </div>
    </div>
  </div>
  <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
  <van-popup v-model:show="valNum" round>
    <div class="valNum">
      <div class="title">
        <p>{{ $t("game0.g36") }}</p>
        <p>{{ $t("game0.g20") }}</p>
        <p>{{ $t("game0.g22") }}</p>
        <p>{{ $t("game0.g21") }}</p>
      </div>
      <div class="box">
        <div class="item" v-for="(item, index) of valNumList" :key="index">
          <p>{{ item.category }}</p>
          <p>{{ item.name }}</p>
          <p style="color: #21ff04">{{ item.amount }}</p>
          <p>{{ item.odds }}</p>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>