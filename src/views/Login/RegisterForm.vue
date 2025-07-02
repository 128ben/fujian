<template>
  <div class="formlogo">
    <img :src="registerImg" alt="" />
    <p>{{$t('newLang.a5')}}</p>
    <p>{{ $t('login0.l28') }}</p>
  </div>
  <context-holder />
  <div class="loginForm">
    <a-form :model="formState" name="basic" autocomplete="off" @finish="onFinish" @finishFailed="onFinishFailed">
      <!-- 昵称 -->
      <!-- <a-form-item label="nickname" name="nickname" :rules="[{ required: true, message: $t('login0.l16') }]">
        <div class="inputBox">
          <UserOutlined />
          <a-input v-model:value="formState.nickname" :placeholder="$t('login0.l17')" />
        </div>
      </a-form-item> -->
      <!-- 手机号 -->
      <a-form-item label="username" name="username" :rules="[{ required: true, message: $t('login0.l31') }]">
        <div class="inputBox">
          <MobileOutlined />
          <a-input v-model:value="formState.username" :placeholder="$t('login0.l30')" />
        </div>
      </a-form-item>
      <!-- 密码 -->
      <a-form-item label="Password" name="password" :rules="[{ required: true, message: $t('login0.l7') }]">
        <div class="inputBox">
          <UnlockOutlined />
          <a-input-password class="custom-input" v-model:value="formState.password" :placeholder="$t('login0.l18')" />
        </div>
      </a-form-item>
      <!-- 确认密码 -->
      <a-form-item label="password_confirmation" name="password_confirmation" :rules="[
        { required: true, message: $t('login0.l20') },
      ]">
        <div class="inputBox">
          <UnlockOutlined />
          <a-input-password class="custom-input" v-model:value="formState.password_confirmation"
            :placeholder="$t('login0.l21')" />
        </div>
      </a-form-item>
      <!-- 邀请码 -->
      <a-form-item label="invite" name="invite" :rules="[
        { required: false, message: $t('login0.l25') },
      ]">
        <div class="inputBox">
          <ShareAltOutlined />
          <a-input v-model:value="formState.invite" :readonly="userStore.invite" :placeholder="$t('login0.l24')" />
          <p class="demo" @click="touristPlay">{{ $t('login0.l33') }}</p>
        </div>
      </a-form-item>
      <a-form-item name="satisfy">
        <a-radio-group v-model:value="formState.satisfy">
          <a-radio class="radio_satisfy" :value="1">{{ $t('login0.l35') }}</a-radio>
          <a-radio class="radio_under" :value="2">{{ $t('login0.l36') }}</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item name="remember">
        <a-checkbox class="rule" v-model:checked="formState.remember">{{ $t('login0.l26') }}
          <b>{{ $t('login0.l27') }}</b></a-checkbox>
      </a-form-item>
      <a-form-item>
        <a-button class="submitBtn" type="primary" html-type="submit">{{ $t('hint.h19') }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import img from "@/assets/images/avatar.png"
import { ref, reactive, defineEmits } from "vue";
import { message } from "ant-design-vue";
import { useUserStore } from "@/store/useUserStore";
import { RegisterApi, visitorLogin } from "@/utils/api";
import { useI18n } from "vue-i18n";
import registerImg from "@/assets/images/register.png";
import {
  UserOutlined,
  MobileOutlined,
  MailOutlined,
  UnlockOutlined,
  ShareAltOutlined,
} from "@ant-design/icons-vue";
const emit = defineEmits();
const { t } = useI18n();
const userStore = useUserStore();
interface FormState {
  nickname: string;
  phone: string;
  password: string;
  password_confirmation: string;
  invite: string;
  remember: boolean;
  satisfy: number;
}
const formState = reactive<FormState>({
  nickname: "",
  phone: "",
  password: "",
  password_confirmation: "",
  invite: "",
  remember: true,
  satisfy: 1,
});
const ipapi = ref(JSON.parse(localStorage.getItem("ipapi")));
const [messageApi, contextHolder] = message.useMessage();
const onFinish = async (values: any) => {
  // if (values.nickname.length < 4) {
  //   messageApi.warning(t('login0.l10'));
  //   return false;
  // }
  // if (values.nickname.length > 15) {
  //   messageApi.warning(t('login0.l11'));
  //   return false;
  // }
  if (values.password.length < 6) {
    messageApi.warning(t('login0.l12'));
    return false;
  }
  if (values.password_confirmation != values.password) {
    messageApi.warning(t('login0.l13'));
    return false;
  }
  if (values.satisfy != 1) {
    messageApi.warning(t('login0.l34'));
    return false;
  }
  if (!values.remember) {
    messageApi.warning(t('login0.l15'));
    return false;
  }

  // const { password_confirmation, remember, satisfy, ...submitObj } = values;
  // submitObj.url = location.hostname;
  // submitObj.ip = ipapi.value.ip;
  // submitObj.country = ipapi.value.country_code_iso3;
  // submitObj.region = ipapi.value.region;
  // submitObj.city = ipapi.value.city;
  messageApi.loading("Loading...");
  try {
    const res = await RegisterApi({
      invite: values.invite,
      username: values.username,
      password: values.password,
      password_two: values.password_confirmation,
    });
    if (res.success == 200) {
      const account = submitObj.username;
      const password = submitObj.password;
      userStore.setAccount(account);
      userStore.setPassword(password);
      messageApi.success(res.message);
      setTimeout(() => {
        emit("finish", 1);
      }, 1000);
    }
  } catch (error) { }
};

const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};
const touristPlay = async () => {
  messageApi.loading("Loading...");
  try {
    const res = await visitorLogin();
    if (res.success == 200) {
      userStore.setUserInfo({
        "balance": "0.00",
        "invite": "",
        nickname: res.data.nickname,
        "avatar": res.data.avatar,
        "token": res.data.token,
        "amountType": 1,//金额类型：1：金币，2：真实金额
        is_analog:res.data.is_analog,// 1游客登录
      });
      userStore.setToken(res.data.accessToken);
      messageApi.destroy()
      messageApi.success(t('newLang.a4'));
      setTimeout(() => {
        emit("finish", 0);
      }, 1000);
    }
  } catch (error) { }
}
</script>
<style lang="scss" scoped>
.demo {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(1px, -50%);
  text-align: center;
  background: #8957F5;
  color: #fff;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4vw;
  border-radius: 0 8px 8px 0;
  font-weight: bold;
}

.loginForm {
  color: #fff;
  max-width: 320px;

  .inputBox {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    background-color: #1a2c38;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    position: relative;

    .custom-input ::placeholder {
      color: rgba(255, 255, 255, 0.6);
      /* 修改为您想要的颜色 */
      opacity: 1;
      /* 确保占位符完全不透明 */
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

.rule {
  font-size: 12px !important;

  b {
    color: $warning;
    cursor: pointer;
  }
}

.ant-checkbox-wrapper {
  color: #fff;
}

.submitBtn {
  width: 100%;
}

#basic_satisfy {
  display: flex;
  justify-content: space-between;
}

.ant-radio-wrapper {
  margin-inline-end: 0px;
}

.radio_satisfy {
  :deep(span:last-child) {
    padding: 0 0 0 2px;
  }

  font-size: 12px;
  color: #ff7875;

  :deep(.ant-radio-checked .ant-radio-inner) {
    border-color: #ff7875;
    background-color: #ff7875;
  }
}

.radio_under {
  :deep(span:last-child) {
    padding: 0 0 0 2px;
  }

  font-size: 12px;
  color: #1677ff;
}
</style>