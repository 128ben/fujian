<script lang="ts" setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount, defineEmits } from "vue";
import { message } from "ant-design-vue";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "axios";
import arIcon from "@/assets/svg/gj_ar.svg";
import enIcon from "@/assets/svg/gj_en.svg";
import esIcon from "@/assets/svg/gj_es.svg";
import faIcon from "@/assets/svg/gj_fa.svg";
import hiIcon from "@/assets/svg/gj_hi.svg";
import idIcon from "@/assets/svg/gj_id.svg";
import ruIcon from "@/assets/svg/gj_ru.svg";
import trIcon from "@/assets/svg/gj_tr.svg";
import uaIcon from "@/assets/svg/gj_ua.svg";
import uzIcon from "@/assets/svg/gj_uz.svg";
import viIcon from "@/assets/svg/gj_vi.svg";
import zhIcon from "@/assets/svg/gj_zh.svg";
import ptIcon from "@/assets/svg/gj_pt.svg";
const emit = defineEmits();
const userStore = useUserStore();
const { locale, t } = useI18n();
const loading = ref(true);
const router = useRouter();
const route = useRoute();
const country = ref(""); // 用于存储国家信息
const fetchCountry = async () => {
  try {
    // 使用一个免费的 IP 地址定位 API
    const response = await axios.get("https://ipapi.co/json/");
    country.value = response.data.country_name; // 获取国家名称
    localStorage.setItem("ipapi", JSON.stringify(response.data));
  } catch (error) {
    message.error(t("home0.h13"));
    console.error("获取国家失败:", error);
  }
};

onMounted(() => {
  if (route.query.invite) {
    userStore.setInvite(route.query.invite);
  }
  if (route.query.url) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlInfo = urlParams.get('url');
    localStorage.setItem("urlInfo", urlInfo)
  } else {
    if (localStorage.getItem("urlInfo")) {
      localStorage.removeItem("urlInfo")
    }
  }
  fetchCountry(); // 组件挂载后获取国家信息
});
const langList = ref([
  {
    lang: "العربية",
    val: "ar",
    icon: arIcon,
  },
  {
    lang: "English",
    val: "en",
    icon: enIcon,
  },
  {
    lang: "Brasileiro",
    val: "pt",
    icon: ptIcon,
  },
  {
    lang: "Español",
    val: "es",
    icon: esIcon,
  },
  {
    lang: "فارسی",
    val: "fa",
    icon: faIcon,
  },
  {
    lang: "हिंदी",
    val: "hi",
    icon: hiIcon,
  },
  {
    lang: "Bahasa Indonesia",
    val: "id",
    icon: idIcon,
  },
  {
    lang: "Русский",
    val: "ru",
    icon: ruIcon,
  },
  {
    lang: "Türkçe",
    val: "tr",
    icon: trIcon,
  },
  {
    lang: "українська",
    val: "ua",
    icon: uaIcon,
  },
  {
    lang: "Oʻzbek",
    val: "uz",
    icon: uzIcon,
  },
  {
    lang: "Tiếng Việt",
    val: "vi",
    icon: viIcon,
  },
  {
    lang: "中国",
    val: "zh",
    icon: zhIcon,
  },
]);
const active = ref(1);
const langVal = ref(userStore.lang || "en");

const chooseVal = (val, i) => {
  active.value = i;
  langVal.value = val;
};

const submit = () => {
  message.info("Loading...", 1);
  userStore.setLang(langVal.value);
  locale.value = langVal.value;
  localStorage.setItem('langModal', 1)
  setTimeout(() => {
    emit("LangFinish");
  }, 1000);
};
</script>

<template>
  <div class="langBox">
    <div class="title">
      <div class="icon">
        <van-icon name="fail" />
      </div>
      <p>{{ $t("home0.h14") }}</p>
    </div>
    <div class="nowArea">
      <p>{{ $t("home0.h15") }}</p>
      <p class="area">{{ country }}</p>
      <p class="btn" @click="submit">{{ $t("hint.h16") }}</p>
    </div>
    <div class="langList">
      <div :class="`item ${active == index ? 'act' : ''}`" v-for="(item, index) of langList" :key="index"
        @click="chooseVal(item.val, index)">
        <img :src="item.icon" alt="" />
        <p>{{ item.lang }}</p>
        <p>{{ item.val }}</p>
        <van-icon class="iconYes" name="success" v-if="active == index" />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.langBox {
  width: 100vw;
  height: 100vh;
  padding: 5vh 3vh 10px;
  background: #182234;
  z-index: 9;
  position: fixed;
  top: 0;
  left: 0;
  text-align: center;

  .title {
    color: #fb5d5d;
    font-family: "Microsoft YaHei UI";
    font-size: 14px;
    font-weight: 700;
    display: flex;

    .icon {
      display: flex;
      width: 16px;
      height: 16px;
      padding: 10px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 50px;
      background: #fb5d5d;
      color: #fff;
      margin: 0 3px 0 0;
    }
  }

  .nowArea {
    margin: 2vh 0;

    &>p:first-child {
      font-size: 26px;
      font-weight: bold;
      animation: slide-bottom 0.6s;
    }

    .area {
      display: flex;
      width: 100%;
      height: 40px;
      padding: 0px 14px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 4px;
      background: #0c1026;
      font-size: 22px;
      font-weight: 700;
      margin: 10px 0;
      animation: slide-top 0.6s;
    }

    .btn {
      display: flex;
      width: 100%;
      height: 40px;
      padding: 0px 14px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 10px;
      background: #636ff1;
      font-weight: 700;
      margin: 10px 0 0;
      animation: slide-top 0.6s;
    }
  }

  .langList {
    max-height: 56vh;
    overflow: auto;
    padding: 0 0 20px 0;

    .item {
      background: #1e293b;
      margin: 6px 0;
      display: flex;
      padding: 6px 10px;
      align-items: center;
      position: relative;

      &>p:nth-child(2) {
        margin: 0 10px;
      }

      &>p:nth-child(3) {
        color: rgba(255, 255, 255, 0.5);
      }

      img {
        width: 30px;
        border-radius: 6px;
      }
    }

    & .item:nth-child(odd) {
      animation: slide-right-left 0.6s;
    }

    & .item:nth-child(even) {
      animation: slide-left-right 0.6s;
    }

    .act {
      border-top: 1px solid #636ff1;
      border-bottom: 1px solid #636ff1;
      background: rgba(99, 111, 241, 0.12);

      .iconYes {
        position: absolute;
        right: 2vw;
        color: #74db5f;
        font-size: 20px;
      }
    }
  }
}
</style>