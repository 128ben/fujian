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
        <div class="inputBox">
          <p>提现地址</p>
          <input type="number" v-model="pageData.address" />
          <!-- <p></p> -->
        </div>
        <div>
          <p class="nowVal">
            {{ $t('tx0.t9') }} <b>{{ pageData.balance }}</b>
            <b class="allText" @click="allVal">{{ $t('tx0.t10') }}</b>
          </p>
          <p class="nowVal">
            {{ $t('tx0.t11') }} <b>{{ (pageData.balance / rate).toFixed(2) }}</b> {{ currency }}
          </p>
        </div>
        <div class="flexGird">
          <div class="item" :class="`item ${actItem == item.money ? 'act' : ''}`" v-for="(item, index) of money_list"
            :key="index" @click="getVal(item)">
            {{ item.money }}
          </div>
        </div>
        <!-- <p class="bind2" @click="gotoBind">{{ $t('tx0.t12') }}</p> -->
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
<script setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { withdrawApi, withdrawSubmitApi, getwithdrawInfoApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "vue-router";
const userStore = useUserStore();
const router = useRouter();
const passwordShow = ref(false);
const pageData = ref({})
const list = ref([]);
const allow_money = ref("");
const money_list = ref([]);
const isType = ref("");
const payAct = ref(0);
const valMin = ref("1");
const valMax = ref("999999");
const payVal = ref("");
const isShow = ref(true);
const actions = ref([
  {
    "type": "TRC-USDT",
    "name": "TRC-USDT",
    "input": 1,
    "currency": "USD",
    "service_fees": 0,
    "min": "1.00",
    "max": "999999.00",
    "account_type_list": [
      {
        "text": "TRC20-USDT",
        "value": "TRC20-USDT"
      },
      {
        "text": "EUR",
        "value": "EUR"
      },
      {
        "text": "IQD",
        "value": "IQD"
      },
      {
        "text": "USD",
        "value": "USD"
      },
      {
        "text": "GBP",
        "value": "GBP"
      },
      {
        "text": "BRL",
        "value": "BRL"
      },
      {
        "text": "AED",
        "value": "AED"
      },
      {
        "text": "SAR",
        "value": "SAR"
      },
      {
        "text": "KWD",
        "value": "KWD"
      }
    ],
    "icon": "https://image.win7777.xyz/bgimg/icon/tether.svg",
    "rate": 10,
    "account_info": {
      "account": "112233"
    },
    "money_list": [
      {
        "id": 0,
        "money": "20"
      },
      {
        "id": 1,
        "money": "30"
      },
      {
        "id": 2,
        "money": "50"
      },
      {
        "id": 3,
        "money": "100"
      },
      {
        "id": 4,
        "money": "300"
      },
      {
        "id": 5,
        "money": "500"
      },
      {
        "id": 6,
        "money": 3000
      },
      {
        "id": 7,
        "money": 5000
      },
      {
        "id": 8,
        "money": 10000
      }
    ]
  },
]);
const passwordVal = ref("");
const showKeyboard = ref(true);
const bindVal = ref("");
const rate = ref("");
const service_fees = ref("");
const currency = ref("")
const { t } = useI18n();
const choosePayVal = (val, i, account) => {
  // message.info("Loading...", 1)
  // getData()
  // payAct.value = i
  // if (account == "") {
  //   router.push(`/Bind/${val}`);
  // }
  // isType.value = val
}
onMounted(() => {
  getData();
});
const getData = async () => {
  //   message.loading("Loading...");
  try {
    const res = await withdrawApi({});
    if (res.success == 200) {
      pageData.value = res.data
      // list.value = res.data.list;
      // actions.value = res.data.list.map((item) => {
      //   return { ...item, name: item.name };
      // });
      // if (res.data.has_account == 0) {
      //   if (res.data.list[payAct.value].account_info.account == "") {
      //     router.push(`/Bind/${res.data.list[payAct.value].type}`);
      //   }
      // }
      currency.value = actions.value[payAct.value].currency
      // allow_money.value = res.data.allow_money;
      money_list.value = actions.value[payAct.value].money_list;
      // isType.value = res.data.list[payAct.value].type;
      rate.value = actions.value[payAct.value].rate;
      service_fees.value = actions.value[payAct.value].service_fees;
      // valMin.value = res.data.list[payAct.value].min;
      // valMax.value = res.data.list[payAct.value].max;
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
  if (Number(payVal.value) > Number(pageData.value.balance)) {
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
  // getInfo()
  submit()
};
const submit = async () => {
  passwordShow.value = false;
  message.loading("Loading...");
  try {
    const res = await withdrawSubmitApi({
      type: isType.value,
      amount: payVal.value,
      address: pageData.value.address,
    });
    if (res.success==200) {
      message.success("提交成功");
      setBalance(res.data.userInfo.balance)
      userStore.setUserInfo(res.data.userInfo.balance,'balance')
      payVal.value = "",
      actItem.value = ""
      getData();
    }
  } catch (error) { }
};
const actItem = ref("");
const getVal = (item, index) => {
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
  if (Number(pageData.value.balance) < 1) {
  } else {
    payVal.value = Number(pageData.value.balance);
    actItem.value = payVal.value;
  }
};
// const gotoBind = () => {
//   router.push(`/Bind/${isType.value}`);
// };
// const getInfo = async () => {
//   try {
//     const res = await getwithdrawInfoApi({
//       type: isType.value
//     })
//     if (res.success) {
//       if (res.data.account_type == '') {
//         router.push(`/Bind/${isType.value}`);
//       } else {
//         passwordShow.value = true;
//       }
//     }
//   } catch (error) {

//   }
// }
</script>
<style lang="scss" scoped>
@import url("./index.scss");
</style>