<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { withdrawApi, withdrawSubmitApi, getwithdrawInfoApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "vue-router";
const router = useRouter();
const passwordShow = ref(false);
const list = ref([]);
const allow_money = ref("");
const money_list = ref([]);
const isType = ref("");
const payAct = ref(0);
const valMin = ref("1");
const valMax = ref("0");
const payVal = ref("");
const isShow = ref(true);
const actions = ref([]);
const passwordVal = ref("");
const showKeyboard = ref(true);
const bindVal = ref("");
const rate = ref("");
const service_fees = ref("");
const currency = ref("")
const { t } = useI18n();
const choosePayVal = (val, i, account) => {
  message.info("Loading...", 1)
  getData()
  payAct.value = i
  if (account == "") {
    router.push(`/Bind/${val}`);
  }
  isType.value = val
}
onMounted(() => {
  getData();
});
const getData = async () => {
  //   message.loading("Loading...");
  try {
    const res = await withdrawApi({});
    if (res.success) {
      list.value = res.data.list;
      actions.value = res.data.list.map((item) => {
        return { ...item, name: item.name };
      });
      if (res.data.has_account == 0) {
        if (res.data.list[payAct.value].account_info.account == "") {
          router.push(`/Bind/${res.data.list[payAct.value].type}`);
        }
      }
      currency.value = res.data.list[payAct.value].currency
      allow_money.value = res.data.allow_money;
      money_list.value = res.data.list[payAct.value].money_list;
      isType.value = res.data.list[payAct.value].type;
      rate.value = res.data.list[payAct.value].rate;
      service_fees.value = res.data.list[payAct.value].service_fees;
      valMin.value = res.data.list[payAct.value].min;
      valMax.value = res.data.list[payAct.value].max;
      isShow.value = false;
    }
  } catch (error) {
    isShow.value = false;
  }
};

const openPassword = () => {
  if (payVal.value == "") {
    message.error(t('tx0.t1'));
    return false;
  }
  if (Number(payVal.value) > Number(allow_money.value)) {
    message.error(t('tx0.t2'));
    return false;
  }
  if (payVal.value > valMax.value) {
    message.error(
      `${t('tx0.t4')} ${valMax.value}`
    );
    return false;
  }
  if (payVal.value < valMin.value) {
    message.error(`${t('tx0.t5')} ${valMin.value}`);
    return false;
  }
  getInfo()
};
const submit = async () => {
  passwordShow.value = false;
  message.loading("Loading...");
  try {
    const res = await withdrawSubmitApi({
      type: isType.value,
      amount: payVal.value,
      pay_password: passwordVal.value,
    });
    if (res.success) {
      message.success(res.message);
      passwordVal.value = "";
      getData();
    } else {
      message.error(res.message);
    }
  } catch (error) { }
};
const actItem = ref<String>("");
const getVal = (item: any, index: Number) => {
  actItem.value = item.money;
  payVal.value = item.money;
};
const payValFun = (e) => {
  actItem.value = e.target.value;
};
const goBack = () => {
  router.push("/User");
};
const allVal = () => {
  if (Number(allow_money.value) < 1) {
  } else {
    payVal.value = Number(allow_money.value);
    actItem.value = payVal.value;
  }
};
const gotoBind = () => {
  router.push(`/Bind/${isType.value}`);
};
const getInfo = async () => {
  try {
    const res = await getwithdrawInfoApi({
      type: isType.value
    })
    if (res.success) {
      if (res.data.account_type == '') {
        router.push(`/Bind/${isType.value}`);
      } else {
        passwordShow.value = true;
      }
    }
  } catch (error) {

  }
}
</script>

<template>
  <div class="wallet">
    <a-spin tip="Loading..." class="loading" :spinning="isShow"> </a-spin>
    <div v-if="!isShow">
      <div class="head">
        <van-icon name="arrow-left" @click="goBack" />
        <p>{{ $t('tx0.t6') }}</p>
      </div>
      <div class="method">
        <p>{{ $t('tx0.t7') }}</p>
        <div class="cellBox">
          <div v-for="(item, index) of actions" :key="index"
            @click="choosePayVal(item.type, index, item.account_info.account)">
            <div :class="`isCheck ${payAct == index ? 'act' : ''}`">
              <van-icon name="success" v-if="payAct == index" />
            </div>
            <img :src="item.icon" alt="" />
            <p>{{ item.name }}</p>
          </div>
          <!-- <van-icon name="arrow" /> -->
        </div>
        <!-- <van-action-sheet v-model:show="show" :actions="actions" @select="onSelect" /> -->
      </div>
      <div class="handle">
        <div class="inputBox">
          <p>{{ $t('tx0.t8') }}</p>
          <input type="number" v-model="payVal" @input="payValFun" />
          <!-- <p></p> -->
        </div>
        <div>
          <p class="nowVal">
            {{ $t('tx0.t9') }} <b>{{ allow_money }}</b>
            <b class="allText" @click="allVal">{{ $t('tx0.t10') }}</b>
          </p>
          <p class="nowVal">
            {{ $t('tx0.t11') }} <b>{{ (allow_money / rate).toFixed(2) }}</b> {{ currency }}
          </p>
        </div>
        <div class="flexGird">
          <div class="item" :class="`item ${actItem == item.money ? 'act' : ''}`" v-for="(item, index) of money_list"
            :key="index" @click="getVal(item)">
            {{ item.money }}
          </div>
        </div>
        <p class="bind2" @click="gotoBind">{{ $t('tx0.t12') }}</p>
        <div class="fee">
          <div class="flex_row">
            <p>{{ $t('tx0.t14') }}</p>
            <p>{{ service_fees * 100 }}%</p>
          </div>
          <div class="flex_row">
            <p>{{ $t('tx0.t15') }}</p>
            <p>{{ (payVal - (payVal * service_fees).toFixed(2)).toFixed(2) }}</p>
          </div>
        </div>
        <div class="btn" @click="openPassword">{{ $t('tx0.t6') }}</div>
      </div>
    </div>
    <van-action-sheet v-model:show="passwordShow" :title="`${$t('tx0.t16')}`">
      <div class="content">
        <div class="passwordBox">
          <!-- 密码输入框 -->
          <van-password-input :value="passwordVal" :focused="showKeyboard" @focus="showKeyboard = true" />
          <!-- 数字键盘 -->
          <van-number-keyboard v-model="passwordVal" :show="showKeyboard" :maxlength="6" @focus="showKeyboard = true" />
        </div>
        <p class="btn" @click="submit">{{ $t('hint.h19') }}</p>
      </div>
    </van-action-sheet>
  </div>

</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>