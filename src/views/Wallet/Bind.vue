<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { withdrawBindApi, getwithdrawInfoApi } from "@/utils/api";
import { useRouter, useRoute } from "vue-router";
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// 表单
const account_type = ref('');
const username = ref("");
const account = ref("");
const bank = ref("");
const mobile = ref("");
const password = ref("");

const account_typeShow = ref(0);
const usernameShow = ref(0);
const accountShow = ref(0);
const bankShow = ref(0);
const mobileShow = ref(0);
const passwordShow = ref(0);
const has_password = ref(0);
const methodsType = ref(route.params.type)

const pickerValue = ref([account_type.value]);
const showPicker = ref(false);
const columns = ref();
const onConfirm = ({ selectedValues, selectedOptions }) => {
  account_type.value = selectedOptions[0]?.text;
  pickerValue.value = selectedValues;
  showPicker.value = false;
};

const pickerValue1 = ref([methodsType.value]);
const showPicker1 = ref(false);
const columns1 = ref();
const onConfirm1 = ({ selectedValues, selectedOptions }) => {
  methodsType.value = selectedOptions[0]?.text;
  pickerValue1.value = selectedValues;
  showPicker1.value = false;
  getInfo(selectedOptions[0]?.text)
};
const passwordPop = ref(false)
const passwordValue = ref('');
const onSubmit1 = async (values) => {
  values.type = methodsType.value
  // if (has_password.value == 0) {
  //   getWithdrawalVal(values)
  // } else {
  //   passwordPop.value = true
  // }
  getWithdrawalVal(values)

}
const getWithdrawalVal = async (values) => {
  // if (has_password.value != 0 && passwordValue.value == "") {
  //   return false
  // }
  passwordPop.value = false
  message.loading("Loading...")
  try {
    const res = await withdrawBindApi({
      type: methodsType.value,
      username: username.value,
      account: account.value,
      account_type: account_type.value,
      bank: bank.value,
      mobile: mobile.value,
      password: password.value,
      // confirm_password: passwordValue.value,
    })
    if (res.success) {
      message.success(res.message);
      setTimeout(() => {
        router.push("/Withdrawal");
      }, 1000);
    } else {
      message.error(res.message);
    }
  } catch (error) {

  }
}

onMounted(() => {
  getInfo(methodsType.value)
});
const forbid = ref(false)
const getInfo = async (params) => {
  try {
    const res = await getwithdrawInfoApi({
      type: params
    })
    if (res.success) {
      if (res.data.account_type == '') {
        forbid.value = false
      } else {
        forbid.value = true
      }
      columns.value = res.data.account_type_list
      columns1.value = res.data.type_list

      // 表单是否禁用
      account_typeShow.value = res.data.account_type_input
      usernameShow.value = res.data.username_input
      accountShow.value = res.data.account_input
      bankShow.value = res.data.bank_input
      mobileShow.value = res.data.mobile_input
      passwordShow.value = res.data.password_input
      has_password.value = res.data.has_password
      // 表单赋值
      account_type.value = res.data.account_type
      username.value = res.data.username
      account.value = res.data.account
      bank.value = res.data.bank
      mobile.value = res.data.mobile
      password.value = res.data.password
    }
  } catch (error) {

  }
}
const openFun = () => {
  if (forbid.value) return false;
  showPicker.value = true;
}
const goBack = () => {
  router.push("/User");
};
const showKeyboard = ref(true);
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement; // 将 event.target 断言为 HTMLInputElement
  const value = target.value;
  password.value = value.replace(/\D/g, ''); // 过滤非数字字符
};
const openMethod = () => {
  showPicker1.value = true;
}
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t('tx0.t12') }}</p>
  </div>
  <div class="page">
    <div class="form">
      <van-form @submit="onSubmit1" label-width="10rem">
        <van-cell-group inset>
          <van-field v-model="methodsType" required readonly name="methodsType" :label="$t('tx0.t43')" :placeholder="$t('tx0.t33')"
            @click="openMethod" :rules="[
              { required: true, message: $t('tx0.t42') },
            ]" />
          <van-field v-if="account_typeShow == 1" v-model="account_type" required readonly :name="t('tx0.t36')"
            :label="t('tx0.t36')" :placeholder="$t('tx0.t33')" @click="openFun" :rules="[
              { required: true, message: $t('tx0.t35') },
            ]" />
          <van-field v-if="usernameShow == 1" v-model="username" required name="username" :label="$t('tx0.t24')"
            :placeholder="$t('tx0.t17')" :rules="[{ required: true, message: $t('tx0.t17') }]" />
          <van-field v-if="accountShow == 1" v-model="account" required name="account" :label="$t('tx0.t27')"
            :placeholder="$t('tx0.t19')" :rules="[
              { required: true, message: $t('tx0.t31') },
            ]" />
          <van-field v-if="mobileShow == 1" type="digit" v-model="mobile" required name="mobile"
            :label="$t('login0.l30')" :placeholder="$t('login0.l31')" :rules="[
              { required: true, message: $t('login0.l31') },
            ]" />
          <van-field v-if="bankShow == 1" v-model="bank" required name="bank" :label="$t('tx0.t37')"
            :placeholder="$t('tx0.t38')" :rules="[
              { required: true, message: $t('tx0.t38') },
            ]" />
          <van-field v-if="passwordShow == 1" type="password" v-model="password" required maxlength="6" name="password"
            :label="$t('tx0.t40')" :placeholder="$t('tx0.t41')" @input="handleInput" :rules="[
              { required: true, message: $t('tx0.t34') },
            ]" />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block class="btn" native-type="submit">
            {{ $t('hint.h19') }}
          </van-button>
        </div>
      </van-form>
    </div>
    <van-popup v-model:show="showPicker" destroy-on-close position="bottom">
      <van-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" :columns="columns"
        :model-value="pickerValue" @confirm="onConfirm" @cancel="showPicker = false" />
    </van-popup>
    <van-popup v-model:show="showPicker1" destroy-on-close position="bottom">
      <van-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" :columns="columns1"
        :model-value="pickerValue1" @confirm="onConfirm1" @cancel="showPicker1 = false" />
    </van-popup>
    <van-action-sheet v-model:show="passwordPop" :title="$t('tx0.t16')">
      <div class="content">
        <div class="passwordBox">
          <!-- 密码输入框 -->
          <van-password-input :value="passwordValue" :focused="showKeyboard" @focus="showKeyboard = true" />
          <!-- 数字键盘 -->
          <van-number-keyboard v-model="passwordValue" :show="showKeyboard" :maxlength="6"
            @focus="showKeyboard = true" />
        </div>
        <p class="btn" @click="getWithdrawalVal">{{ $t('hint.h19') }}</p>
      </div>
    </van-action-sheet>
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

.page {
  padding: 44px 0 0 0;

  .form {
    padding: 20px 0 0 0;

    .btn {
      display: flex;
      height: 40px;
      padding: 10px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 5px;
      background: #febe29;
      color: #000;
      font-weight: 600;
      border: none;
    }
  }
}

.passwordBox {
  width: 90vw;
  padding: 10px 0;
  text-align: center;

  .title {
    font-size: 22px;
    font-weight: bold;
  }

  .van-button {
    width: 90%;
  }

  :deep(.van-cell) {
    margin: 20px 0;
  }

  :deep(.van-key) {
    color: #000;
  }
}

.van-cell-group,
.van-cell {
  background: #1e293b;
  line-height: 1.3;
  display: block;
}

:deep(.van-field__control),
:deep(.van-field__label) {
  color: #ebf8ff;
}

:deep(.van-cell__title) {
  margin: 0 0 8px 0;
  font-weight: bold;
}

:deep(.van-field__control) {
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.content {
  min-height: 390px;

  .passwordBox {
    margin: 20px auto;
  }

  .btn {
    width: 90%;
    margin: auto;
    display: flex;
    height: 40px;
    padding: 10px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    align-self: stretch;
    border-radius: 5px;
    background: #FEBE29;
    color: #000;
    font-weight: 600;
  }
}

:deep(.van-popup) {
  background: #fff !important;
}
</style>