<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { feedbackApi } from "@/utils/api";
import { message } from "ant-design-vue";
const router = useRouter();
const messageType = ref("");
const loading = ref(false);
const { t } = useI18n();
const goBack = () => {
  router.push("/User");
};
const submit = async () => {
  if (messageType.value == "") {
    message.error(t("input0.i2"));
    return false;
  }
  try {
    loading.value = true;
    const res = await feedbackApi({
      content:messageType.value
    })
    if (res.success) {
      message.success(res.message);
      messageType.value = "";
    }else{
      message.error(res.message);
    }
    loading.value = false;

  } catch (error) {

  }
};
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t("Feedback0.f1") }}</p>
  </div>
  <div class="pages">
    <div class="formBox">
      <van-field v-model="messageType" rows="2"  autosize :label="$t('Feedback0.f1')" type="textarea" maxlength="50"
        :placeholder="$t('input0.i1')" show-word-limit />
      <van-button :loading="loading" @click="submit">{{
        $t("hint.h19")
      }}</van-button>
    </div>
  </div>
</template>

<style lang="scss">
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
  padding: 64px 10px;

  .formBox {
    .van-cell {
      background: #0c1026;
      color: #fff;
    }

    .van-field__word-limit,
    .van-field__control,
    .van-field__label {
      color: #fff;
    }

    .van-button {
      margin: 50px auto 0;
      display: flex;
      width: 90%;
      height: 36px;
      padding: 10px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 5px;
      background: #febe29;
      border: none;
    }
  }
}
.van-field__label{
  width: auto;
}
</style>