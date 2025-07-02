<template>
  <div class="wallet">
    <a-spin tip="Loading..." class="loading" :spinning="isShow"> </a-spin>
    <div v-if="!isShow">
      <div class="head">
        <van-icon name="arrow-left" @click="goBack" />
        <p>{{ $t("cz0.c5") }}</p>
      </div>
      <div class="method">
        <p>{{ $t("cz0.c6") }}</p>
        <div class="cellBox">
          <div v-for="(item, index) of actions" :key="index" @click="choosePayVal(item.pay_id, index)">
            <div :class="`isCheck ${payAct == index ? 'act' : ''}`">
              <van-icon name="success" v-if="payAct == index" />
            </div>
            <img :src="item.logo" alt="" />
            <p>{{ item.name }}</p>
          </div>
          <!-- <van-icon name="arrow" /> -->
        </div>
        <!-- <van-action-sheet v-model:show="show" :actions="actions" @select="onSelect" /> -->
      </div>
      <div class="handle">
        <div class="inputBox">
          <p>{{ $t("cz0.c7") }}</p>
          <input type="number" v-model="payVal" @input="payValFun" />
          <!-- <p>USDT</p> -->
        </div>
        <div>
          <p class="nowVal">
            {{ $t("cz0.c8") }} <b>{{ (payVal / rate).toFixed(2) }}</b> {{ unit }}
          </p>
        </div>
        <div class="flexGird">
          <div class="item" :class="`item ${payVal == item.value ? 'act' : ''}`" v-for="(item, index) of money_list"
            :key="index" @click="getVal(item)">
            <p>{{ item.value }}</p>
            <!-- <p class="give" v-if="item.gift != 0">+ {{ item.gift }}</p> -->
          </div>
        </div>
        <!-- <p v-if="typeIndex" class="bind1" @click="gotoBind">
          {{ $t('tx0.t12') }}
        </p> -->
        <div class="btn" @click="submit">{{ $t("cz0.c5") }}</div>
      </div>
    </div>
    <van-dialog :cancelButtonText="$t('hint.h21')" show-cancel-button v-model:show="qrCodeShow"
      :confirm-button-text="$t('hint.h27')" :title="`${$t('cz0.c5')} ${Number(amount_recharge).toFixed(2)} USDT`"
      @confirm="copyLink">
      <div class="flexCenter">
        <a-qrcode error-level="Q" :value="link" />
        <p>{{ link }}</p>
      </div>
    </van-dialog>
    <div class="czHtml" v-if="czHtml">
      <div class="head">
        <van-icon name="arrow-left" @click="closeIframe" />
        <p>{{ $t('cz0.c5') }}</p>
      </div>
      <iframe :src="czHtmlVal" frameborder="0"></iframe>
    </div>
  </div>
</template>
<script  setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { rechargeApi, rechargeSubmitApi } from "@/utils/api";
import { useRouter } from "vue-router";
const router = useRouter();
const { t } = useI18n();
const link = ref("");
const qrCodeShow = ref(false);
const list = ref([]);
const money_list = ref([]);
const unit = ref('');
const payAct = ref(0); // 支付类型下标
const isType = ref(""); //支付类型
const valMin = ref("1");
const valMax = ref(99999999);
const payVal = ref(""); //支付金额
const isShow = ref(true);
const actions = ref([]);
const rate = ref(1);
// const typeIndex = ref(false)
const choosePayVal = (val, i) => {
  payAct.value = i
  isType.value = val
}
onMounted(() => {
  getData();
});
const getData = async () => {
  //   message.loading("Loading...");
  try {
    const res = await rechargeApi({});
    if (res.success==200) {
      list.value = res.data.list;
      actions.value = res.data.pay
      // if (res.data.list[payAct.value].type == "BANK-PAY") {
      //   typeIndex.value = true
      // } else {
      //   typeIndex.value = false
      // }
      money_list.value = res.data.recharge_amount;
      // rate.value = res.data.list[payAct.value].rate;
      // unit.value = res.data.list[payAct.value].currency
      isType.value = res.data.pay[0].pay_id
      // valMin.value = res.data.list[payAct.value].min;
      // valMax.value = res.data.list[payAct.value].max;
      isShow.value = false;
    }
  } catch (error) { }
};
const czHtml = ref(false)
const czHtmlVal = ref('')

const amount_recharge = ref(0)
const submit = async () => {
  if (payVal.value == "") {
    message.error(t("cz0.c1"));
    return false;
  }
  if (payVal.value > valMax.value) {
    message.error(`${t("cz0.c2")} ${valMax.value}`);
    return false;
  }
  if (payVal.value < valMin.value) {
    message.error(`${t("cz0.c3")} ${valMin.value}`);
    return false;
  }
  message.loading("Loading...");
  try {
    const res = await rechargeSubmitApi({
      pay_id: isType.value,
      amount: payVal.value,
    });
    if (res.success==200) {
      // if (res.data.type == 2) {
      //   if (!res.data.address) {
      //     message.success(res.message)
      //     getData();
      //   } else {
      //     czHtml.value = true
      //     czHtmlVal.value = res.data.address
      //   }
      // } else {
        link.value = res.data.address;
        amount_recharge.value = res.data.amount_recharge
        qrCodeShow.value = true;
        getData();
      // }
    } else {
      message.error(res.message);
      qrCodeShow.value = false;
    }
  } catch (error) { }
};
const closeIframe = () => {
  czHtml.value = false
  czHtmlVal.value = ""
}
const getVal = (item, index) => {
  payVal.value = item.value;
};
const goBack = () => {
  router.push("/User");
};
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(link.value);
    message.success(t("cz0.c4"));
  } catch (err) {
    console.error("复制失败:", err);
  }
};
// const gotoBind = () => {
//   router.push(`/DepositBind/${isType.value}`);
// };
</script>



<style lang="scss" scoped>
@import url("./index.scss");
</style>