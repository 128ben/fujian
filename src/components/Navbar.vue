<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { CreditCardOutlined } from "@ant-design/icons-vue";
import LoginPop from "@/views/Login/index.vue";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useRoute } from "vue-router";
import logoImg from "@/assets/img/logo.png";

const route = useRoute();
const router = useRouter();
const isShow = ref(false);
watch(
  () => route.path,
  (newPath) => {
    if (route.path == "/") {
      isShow.value = true;
    } else {
      isShow.value = false;
    }
  }
);
const userStore = useUserStore();

const loginShow = ref(false);
const loginType = ref<Number>(0);
const openLogin = (type: Number) => {
  loginShow.value = true;
  loginType.value = type;
};
const closeLogin = (val: Number) => {
  switch (val) {
    case 0:
      location.reload();
      break;
    case 1:
      loginShow.value = false;
      openLogin(0);
      break;
    default:
      loginShow.value = false;
      break;
  }
};

// 在组件挂载时设置定时器
onMounted(() => {});
const backPage = () => {
  router.go(-1);
};
const gotoCZ = () => {
  router.push("/Deposit");
};
</script>

<template>
  <div class="mobile_header">
    <div class="logo" v-if="route.path == '/'">
      <img :src="logoImg" alt="" />
    </div>
    <van-icon
      size="20"
      name="arrow-left"
      v-if="route.name == 'Game'"
      @click="backPage"
    />
    <div class="pageTitle" v-if="route.path != '/'">{{ route.name }}</div>
    <div class="btnBox" v-if="!userStore.token">
      <a-button class="btn1" @click="openLogin(0)">{{$t('hint.h23')}}</a-button>
      <a-button class="btn3" @click="openLogin(1)">{{$t('hint.h24')}}</a-button>
    </div>
    <div class="balance" v-else @click="gotoCZ">
      <div v-if="route.path == '/'">
        <p>{{ userStore.userInfo.balance }}</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
        >
          <rect width="26" height="26" rx="5" fill="#F4CC00" />
          <path
            d="M15.6245 8.83217H20.4362C20.6553 8.83217 20.8654 8.91506 21.0203 9.0626C21.1752 9.21014 21.2622 9.41025 21.2622 9.61891V11.9803H4.73779V9.61891C4.73779 9.41025 4.82483 9.21014 4.97974 9.0626C5.13466 8.91506 5.34478 8.83217 5.56386 8.83217H10.3755L11.3476 10.0132C11.3433 10.2224 11.383 10.4303 11.4641 10.6248C11.5453 10.8192 11.6663 10.9963 11.8202 11.1457C11.974 11.2951 12.1576 11.4137 12.3602 11.4948C12.5628 11.5758 12.7803 11.6175 13 11.6175C13.2197 11.6175 13.4372 11.5758 13.6398 11.4948C13.8424 11.4137 14.026 11.2951 14.1799 11.1457C14.3337 10.9963 14.4548 10.8192 14.5359 10.6248C14.6171 10.4303 14.6567 10.2224 14.6525 10.0132L15.6245 8.83217ZM21.2622 13.5532V19.0615C21.2622 19.2702 21.1752 19.4703 21.0203 19.6178C20.8654 19.7654 20.6553 19.8483 20.4362 19.8483H5.56386C5.34488 19.8483 5.13486 19.7655 4.97996 19.618C4.82506 19.4706 4.73796 19.2707 4.73779 19.0621V13.5538L21.2622 13.5532ZM6.38871 16.3077H10.933V14.7353H6.38871V16.3077Z"
            fill="#6A6212"
          />
          <path
            d="M11.9935 7.39318L11.9935 3.75648C12.0017 3.55321 12.0923 3.36088 12.2462 3.21983C12.4001 3.07879 12.6054 3 12.819 3C13.0326 3 13.2379 3.07879 13.3918 3.21983C13.5457 3.36088 13.6362 3.55321 13.6444 3.75648L13.6444 7.47296L15.1963 5.9944C15.3512 5.84683 15.5614 5.76392 15.7805 5.76393C15.9997 5.76393 16.2098 5.84683 16.3648 5.9944C16.5197 6.14198 16.6068 6.34213 16.6068 6.55083C16.6068 6.75953 16.5197 6.95968 16.3648 7.10725L13.4266 9.90557C13.1089 10.2081 12.6098 10.2081 12.2921 9.90557L9.35389 7.10725C9.19894 6.95968 9.11189 6.75953 9.11189 6.55083C9.11189 6.34213 9.19894 6.14198 9.35389 5.9944C9.50884 5.84683 9.719 5.76392 9.93813 5.76392C10.1573 5.76392 10.3674 5.84683 10.5224 5.9944L11.9935 7.39318Z"
            fill="#2E3007"
          />
        </svg>
      </div>
    </div>
  </div>
  <div class="mobilePadding"></div>
  <LoginPop
    :isShow="loginShow"
    :type="loginType"
    @close="closeLogin"
  ></LoginPop>
</template>

<style lang="scss" scoped>
.ant-btn {
  border: none;
  margin: 0 8px;
  color: $textColor;
  &:hover {
    color: $textColor;
    opacity: 0.8;
  }
}
.btn1 {
  background: linear-gradient(180deg, #04e3ff 0%, #3b67ff 100%);
}
.btn2 {
  background: #327ee1;
}
.btn3 {
  background: #f4cc00;
  color: #000;
}
.mobile_header {
  width: 100%;
  height: 50px;
  padding: 4px 20px;
  background: $boxColor;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  .logo {
    width: 48px;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .btnBox {
    display: flex;
    align-items: center;
  }
  .balance {
    div {
      display: flex;
      align-items: center;
      background: #1a2c38;
      font-size: 14px;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
    }

    p {
      margin: 0 6px 0 0;
    }
  }
  .pageTitle {
    font-size: 18px;
    font-weight: 600;
  }
}
.mobilePadding {
  height: 50px;
}
@media screen and (max-width: 321px) {
  .mobile_header {
    padding: 2px 10px;
  }
  .ant-btn {
    margin: 0 2px;
  }
}
</style>
