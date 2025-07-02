<template>
  <context-holder />
  <div class="formlogo">
    <img :src="loginImg" alt="" />
    <p>{{ $t('newLang.a1') }}</p>
    <p>{{ $t('login0.l28') }}</p>
  </div>
  <div class="loginForm">
    <a-form :model="formState" name="basic" autocomplete="off" @finish="onFinish" @finishFailed="onFinishFailed">
      <a-form-item label="Username" name="username" :rules="[{ required: true, message: $t('login0.l5') }]">
        <div class="inputBox">
          <UserOutlined />
          <a-input v-model:value="formState.username" :placeholder="$t('newLang.a2')" />
        </div>
      </a-form-item>

      <a-form-item label="Password" name="password" :rules="[{ required: true, message: $t('login0.l7') }]">
        <div class="inputBox">
          <UnlockOutlined />
          <a-input-password class="custom-input" v-model:value="formState.password" :placeholder="$t('newLang.a3')" />
        </div>
      </a-form-item>

      <a-form-item name="remember">
        <div style="display: flex;align-items: center;justify-content: space-between;">
          <a-checkbox v-model:checked="formState.remember">{{ $t('login0.l8') }}</a-checkbox>
          <!-- <p style="cursor: pointer;color: #febe29;" @click="forget">{{ $t('login0.l29') }}</p> -->
        </div>
      </a-form-item>

      <a-form-item>
        <a-button class="submitBtn" type="primary" html-type="submit">{{ $t('login0.l9') }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import img from "@/assets/images/avatar.png"
import { ref, reactive, onBeforeUnmount } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/useUserStore";
import { LoginApi, forgetApi, getPingApi } from "@/utils/api";
import { UserOutlined, UnlockOutlined } from "@ant-design/icons-vue";
import loginImg from "@/assets/images/login.png";
interface FormState {
  username: string;
  password: string;
  remember: boolean;
}
const { t } = useI18n();
const [messageApi, contextHolder] = message.useMessage();
const emit = defineEmits();
const userStore = useUserStore();
const formState = reactive<FormState>({
  username: userStore.account || "",
  password: userStore.password || "",
  remember: true,
});
const onFinish = async (values: any) => {
  console.log("Success:", values);
  if (values.username.length < 6) {
    messageApi.warning(t('login0.l1'));
    return false;
  }
  if (values.username.length > 20) {
    messageApi.warning(t('login0.l2'));
    return false;
  }
  if (values.password.length < 6) {
    messageApi.warning(t('login0.l3'));
    return false;
  }
  const { remember, ...submitObj } = values;
  submitObj.url = location.hostname;
  messageApi.loading("Loading...");
  try {
    const res = await LoginApi(submitObj);
    if (res.success == 200) {
      if (values.remember) {
        userStore.setAccount(submitObj.username);
        userStore.setPassword(submitObj.password);
      }
      userStore.setUserInfo({
        "balance": "0.00",
        "invite": "",
        nickname: res.data.nickname,
        "avatar": res.data.avatar,
        "token": res.data.token,
        "amountType": 1,//金额类型：1：金币，2：真实金额
        is_analog: res.data.is_analog,// 1游客登录
      });
      userStore.setToken(res.data.accessToken);
      messageApi.destroy()
      messageApi.success(t('newLang.a4'));
      setTimeout(() => {
        emit("finish", 0);
      }, 1000);
    }
  } catch (error) { }
};


const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};
// const forget = async () => {
//   if (formState.username == "") {
//     message.warning(t('login0.l32'))
//     return false
//   }
//   try {
//     const res = await forgetApi({
//       url: location.hostname,
//       username: formState.username
//     })
//     if (res.success) {
//       window.open(res.data.service);
//     } else {
//       message.warning(res.message)
//     }
//   } catch (error) {

//   }
// }
onBeforeUnmount(() => {
  // stopPolling();
});
</script>
<style lang="scss">
.custom-input ::placeholder {
  color: rgba(255, 255, 255, 0.6);
  /* 修改为您想要的颜色 */
  opacity: 1;
  /* 确保占位符完全不透明 */
}

.formlogo {
  width: 100%;
  position: absolute;
  top: -29px;
  left: 0;
  z-index: 2;

  img {
    width: 100%;
  }

  p:nth-of-type(1) {
    position: absolute;
    z-index: 1;
    bottom: 7.5vh;
    left: 0;
    right: 0px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    text-transform: capitalize;
    padding-left: 100px;
    padding-right: 15px;
  }

  p:nth-of-type(2) {
    position: absolute;
    z-index: 1;
    bottom: 2vh;
    left: 0;
    right: 0px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    text-transform: capitalize;
    padding-left: 100px;
    padding-right: 15px;
  }
}

.loginForm {
  color: #fff;
  width: 300px;
  margin: 90px 0 10px 0;

  .inputBox {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    background-color: #1a2c38;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.4);

    svg {
      margin: 0 0 0 5px;
      font-size: 16px;
      color: $textColor;
    }

    .ant-input-affix-wrapper,
    .ant-input {
      border: none;
      background: none;
      color: $textColor;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }

      &:focus {
        box-shadow: none;
      }
    }
  }
}

.ant-form {
  color: #fff;

  .ant-form-item {
    color: #fff;
    margin-bottom: 10px;

    .ant-form-item-label {
      display: none;
    }
  }
}

.ant-checkbox-wrapper {
  color: #fff;
}

.submitBtn {
  width: 100%;
}

.ant-input-affix-wrapper-focused {
  box-shadow: none;
}
</style>