<template>
  <div class="pages">
    <div class="userInfo">
      <div class="flex">
        <img v-if="userStore.userInfo.avatar" :src="userStore.userInfo.avatar" alt="" />
        <img v-else src="@/assets/images/avatar.png" alt="" />
        <div>
          <p>{{ userStore.userInfo.nickname }}</p>
          <div class="idCopy">
            <p>ID:{{ userData.id }}</p>
            <CopyOutlined @click="copyLink(userData.id)" />
          </div>
          <!-- <p>20th day after joining XX</p> -->
        </div>
      </div>
      <div class="flex">
        <!-- <van-icon name="setting-o" @click="openUserInfo" /> -->
        <!-- <van-icon name="chat-o" @click="showLang = true" /> -->
        <img class="langIcon" :src="langIcon" alt="" @click="showLang = true">
      </div>
    </div>
    <div class="userData">
      <!-- <div class="user_vip" @click="gotoVip">
        <div class="flex">
          <p>VIP {{ vipInfo.now }}</p>
          <div class="progress">
            <a-progress strokeColor="#FEBE29" :percent="progressVal.toFixed(2)" />
          </div>
          <p>VIP {{ vipInfo.next }}</p>
        </div>
        <div class="flex_rule">
          <p>
            {{ $t("user0.u9") }} {{ vipInfo.now_bet }}/{{
              vipInfo.next_bet
            }}
          </p>
          <div class="flex_icon">
            <p>{{ $t("user0.u10") }}</p>
            <van-icon name="arrow" />
          </div>
        </div>
        <div class="flex_equity" v-if="vipList.length > 1">
          <div class="item">
            <img :src="startIcon" alt="" />
            <p>
              {{ $t("user0.u11") }}
            </p>
            <p>{{ vipList[vipInfo.now].day_num_limit }}</p>
          </div>
          <div class="item">
            <img :src="startIcon" alt="" />
            <p>{{ $t("user0.u12") }} </p>
            <p>{{ vipList[vipInfo.now].amount_limit }}</p>
          </div>
          <div class="item">
            <img :src="startIcon" alt="" />
            <p>
              {{ $t("user0.u13") }}
            </p>
            <p>{{ vipList[vipInfo.now].day_amount_limit }}</p>
          </div>
        </div>
      </div> -->
      <div class="user_balance">
        <div class="u_b_box">
          <div class="flex" @click="eyesShow = !eyesShow">
            <p>{{ $t("user0.u14") }}</p>
            <van-icon v-if="eyesShow" name="eye-o" />
            <van-icon v-else name="closed-eye" />
          </div>
          <div class="user_balanceVal" v-if="eyesShow">
            <p style="margin: 0 6px" v-if="isBalanceShow" @click="gotoBalanceData">
              <!-- {{ userStore.userInfo.balance }} -->
              {{ userData.balance }}
            </p>
            <p style="margin: 0 6px" v-else>****</p>
            <van-icon :class="isBalanceShow ? '' : 'act'" name="replay" @click="getUser" />
          </div>
        </div>
        <div class="u_b_fun">
          <div class="item" @click="gotoWallet(0)">
            <img :src="withdrawIcon" alt="" />
            <p>{{ $t("user0.u15") }}</p>
          </div>
          <div class="item" @click="gotoWallet(1)">
            <img :src="rechargeIcon" alt="" />
            <p>{{ $t("user0.u16") }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="userFun">
      <div class="boxBG">
        <div class="text">
          <p>{{ $t("user0.u17") }}</p>
          <p>{{ $t("user0.u8") }}</p>
        </div>
        <div class="flex_text">
          <p @click="userFun(1)">{{ $t("user0.u19") }}</p>
          <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="11" viewBox="0 0 6 11" fill="none">
              <path d="M1 9.66071L5 5.66071L1 1.66071" stroke="#FEBE29" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
        </div>
        <img class="usergiftImg" :src="usergiftImg" alt="" />
        <img :src="userInviteBGImg" alt="" />
      </div>
      <div class="flexBox">
        <div class="item" v-for="(item, index) of list" :key="index" @click="userFun(index)">
          <img :src="item.icon" alt="" />
          <p>{{ $t(item.title) }}</p>
        </div>
      </div>
    </div>
  </div>
  <div class="user_inviteBox" @click="gotoWallet(1)">
    <p>{{ $t("user0.u20") }}</p>
    <p>{{ $t("user0.u21") }}</p>
  </div>
  <div class="outLoginBtn" @click="outLoginShow = true">
    {{ $t("user0.u22") }}
  </div>
  <a-modal v-model:open="outLoginShow" title="Log out" centered @ok="outlogin">
    <p>{{ $t("user0.u23") }}</p>
  </a-modal>
  <van-popup v-model:show="showLang" destroy-on-close round position="bottom">
    <van-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" :model-value="pickerValue"
      :columns="langList" @cancel="showLang = false" @confirm="onConfirm" />
  </van-popup>
  <van-popup v-model:show="levelPop">
    <div class="levelBox">
      <img class="light" :src="light_pop" alt="" />
      <div class="levelPop">
        <div class="content">
          <div class="vipIcon">
            <p class="nowVal">{{ level_info.level_id }}</p>
            <img :src="vipLevel" alt="">
            <p class="vipText">{{ $t('user0.u27') }}</p>
          </div>
          <div class="flexBox">
            <p>{{ $t('user0.u28') }}</p>
            <div class="flexIcon">
              <img :src="coinImg" alt="">
              <p>{{ 500000 }}</p>
            </div>
          </div>
        </div>
        <div class="btn" @click="levelPop = false">{{ $t('hint.h16') }}</div>
      </div>
    </div>
  </van-popup>
</template>
<script setup>
const [messageApi, contextHolder] = message.useMessage();
import { showConfirmDialog } from "vant"
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { CopyOutlined } from "@ant-design/icons-vue";
import { outLoginApi, getVipApi, UserApi, getServiceApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { useI18n } from "vue-i18n";
import userInviteBGImg from "@/assets/img/user_Invite_bg.png";
import usergiftImg from "@/assets/img/user_gift.png";
import langIcon from "@/assets/svg/lang.svg";
import rechargeIcon from "@/assets/svg/user_CZ.svg";
import withdrawIcon from "@/assets/svg/user_money.svg";
import betIcon from "@/assets/svg/user_bet.svg";
import czIcon from "@/assets/svg/user_recharge.svg";
import severIcon from "@/assets/svg/user_sever.svg";
import helpIcon from "@/assets/svg/user_help.svg";
import faqIcon from "@/assets/svg/user_faq.svg";
import sendIcon from "@/assets/svg/user_send.svg";
import inviteIcon from "@/assets/svg/user_invite.svg";
import shareIcon from "@/assets/svg/user_share.svg";
import startIcon from "@/assets/svg/startIcon.svg";
import light_pop from "@/assets/img/light_pop.png";
import vipLevel from "@/assets/img/vipLevel.png";
import coinImg from "@/assets/img/jinbi.png";

const { locale, t } = useI18n();
const userStore = useUserStore();
const outLoginShow = ref(false);
const router = useRouter();
const eyesShow = ref(true);
const progressVal = ref(0);

onMounted(() => {
  getUser()
  // getVIPData();
});
// const vipList = ref([]);
// const vipInfo = ref({});
// const level_info = ref({});
// const levelPop = ref(false);
// const openVipPop = () => {
//   levelPop.value = true
// }
// const getVIPData = async () => {
//   try {
//     const res = await getVipApi({});
//     if (res.success) {
//       vipInfo.value = res.data.info;
//       vipList.value = res.data.list;
//       level_info.value = res.data.level_info;
//       if (res.data.level_info == 1) {
//         // 弹窗提示 用户升级，奖励金额
//         openVipPop()
//       }
//       let now = res.data.info.now_bet;
//       let total = res.data.info.next_bet;
//       progressVal.value = total > 0 ? (now / total) * 100 : 0;
//     }
//   } catch (error) { }
// };
const list = ref([
  {
    icon: betIcon,
    title: 'user0.u1',
  },
  {
    icon: inviteIcon,
    title: 'user0.u2',
  },
  {
    icon: czIcon,
    title: 'user0.u3',
  },
  {
    icon: severIcon,
    title: 'user0.u4',
  },
  {
    icon: shareIcon,
    title: 'user0.u5',
  },
  {
    icon: helpIcon,
    title: 'user0.u6',
  },
  {
    icon: faqIcon,
    title: 'user0.u7',
  },
  {
    icon: sendIcon,
    title: 'user0.u8',
  },
]);
const outlogin = async () => {
  message.loading("Loading...");
  try {
    // const res = await outLoginApi({});
    // if (res.success) {
    userStore.clearUser();
    message.destroy()
    router.push("/");
    // }
  } catch (error) { }
};
const gotoVip = () => {
  router.push("/VIP");
};
const userFun = (i) => {
  switch (i) {
    case 0:
      router.push("/Betting");
      break;
    case 1:
      router.push("/Invite");
      break;
    case 2:
      if (userStore.userInfo.is_analog == 1) {
        showConfirmDialog({
          title: '游客提示',
          className: "showConfirmDialog-bai",
          confirmButtonText: "去注册",
          message:
            '游客用户暂不可操作，是否退出游客模式并前往注册真实账户',
        })
          .then(() => {
            // on confirm
            userStore.clearUser();
            router.push({
              path: "/",
              query: {
                openLogin: 1
              }
            });
          })
          .catch(() => {
            // on cancel
          });
        return false
      }
      router.push("/Funds");
      break;
    case 3:
      // 客服
      // window.open(userStore.userInfo.service);
      getService()
      break;
    case 4:
      router.push("/Invite");
      break;
    case 5:
      // 帮助中心
      router.push("/Help");
      break;
    case 6:
      if (userStore.userInfo.is_analog == 1) {
        showConfirmDialog({
          title: '游客提示',
          className: "showConfirmDialog-bai",
          confirmButtonText: "去注册",
          message:
            '游客用户暂不可操作，是否退出游客模式并前往注册真实账户',
        })
          .then(() => {
            // on confirm
            userStore.clearUser();
            router.push({
              path: "/",
              query: {
                openLogin: 1
              }
            });
          })
          .catch(() => {
            // on cancel
          });
        return false
      }
      // 意见反馈
      router.push("/Feedback");
      break;
    case 7:
      // 加入我们
      // window.open(userStore.userInfo.joinService);
      break;
  }
};
const getService = async () => {
  // message.loading("Loading...");
  // try {
  //   const res = await getServiceApi({});
  //   if (res.success) {
  //     window.open(res.data.url);
  //   }
  // } catch (error) {

  // }
}
const gotoWallet = (i) => {
  if (userStore.userInfo.is_analog == 1) {
    showConfirmDialog({
      title: '游客提示',
      className: "showConfirmDialog-bai",
      confirmButtonText: "去注册",
      message:
        '游客用户暂不可操作，是否退出游客模式并前往注册真实账户',
    })
      .then(() => {
        // on confirm
        userStore.clearUser();
        router.push({
          path: "/",
          query: {
            openLogin: 1
          }
        });
      })
      .catch(() => {
        // on cancel
      });
    return false
  }
  switch (i) {
    case 0:
      router.push("/Withdrawal");
      break;
    case 1:
      router.push("/Deposit");
      break;
  }
};
// 编辑信息
const openUserInfo = () => {
  router.push("/edit");
};
// 语言切换
const langList = [
  { text: "Brasileiro", value: "pt" },
  { text: "English", value: "en" },
  { text: "Mexicano", value: "es" },
  { text: "عربي", value: "ar" },
  { text: "中文(繁体)", value: "zh" },
];
const showLang = ref(false);
const pickerValue = ref([userStore.lang]);
const onConfirm = ({ selectedValues, selectedOptions }) => {
  showLang.value = false;
  pickerValue.value = selectedValues;
  userStore.setLang(selectedValues[0]);
  locale.value = selectedValues[0];
};
// 获取 用户中心数据
const userData = ref({})
const isBalanceShow = ref(true);
const getUser = async () => {
  isBalanceShow.value = false;
  try {
    const res = await UserApi({});
    if (res.success == 200) {
      userStore.setUserInfo(res.data.balance, "balance");
      userStore.setUserInfo(res.data.invite, "invite");
      userStore.setUserInfo(res.data.avatar, "avatar");
      userStore.setUserInfo(res.data.is_analog, "is_analog");
      userData.value = res.data
      isBalanceShow.value = true;
    }
  } catch (error) { }
};
const copyLink = async (val) => {
  try {
    await navigator.clipboard.writeText(val);
    message.success("copy success");
  } catch (err) {
    console.error("复制失败:", err);
  }
};
const gotoBalanceData = () => {
  router.push('/BalanceData')
}
</script>
<style lang="scss" scoped>
@import url("./index.scss");
</style>