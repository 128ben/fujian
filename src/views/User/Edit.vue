<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { getAvatarApi, submitAvatarApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
const userStore = useUserStore();
const router = useRouter();
const avatar = ref([]);
const active = ref(0);
const currentImg = ref("");
const loading = ref(true);
onMounted(() => {
  getAvatar();
});
const getAvatar = async () => {
  try {
    const res = await getAvatarApi({});
    if (res.success) {
      avatar.value = res.data.list;
      currentImg.value = userStore.userInfo.avatar;
      let a = res.data.list.find((item) => item.img === currentImg.value);
      if (a) {
        active.value = a.id;
      } else {
        active.value = null;
      }
      loading.value = false;
    }
  } catch (error) {}
};
const chooseVal = (val, i) => {
  currentImg.value = val.img;
  active.value = val.id;
};
const goBack = () => {
  router.push("/User");
};
const nextImage = () => {
  active.value = (active.value + 1) % avatar.value.length;
  currentImg.value = avatar.value[active.value].img;
};

const prevImage = () => {
  active.value = (active.value - 1 + avatar.value.length) % avatar.value.length;
  currentImg.value = avatar.value[active.value].img;
};
const submit = async () => {
  message.info("Loading...", 1);
  try {
    const res = await submitAvatarApi({
      id: active.value,
    });
    if (res.success) {
      message.success(res.message);
      currentImg.value = res.data.img;
      userStore.setUserInfo(res.data.img, "avatar");
      getAvatar();
    }
  } catch (error) {}
};
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t("user0.u24") }}</p>
  </div>
  <van-skeleton :loading="loading">
    <template #template>
      <div class="skeletonBox">
        <van-skeleton-image class="skeletonAvatar" />
        <div class="skeletonImg">
          <van-skeleton-paragraph
            class="item"
            v-for="(item, index) of 10"
            :key="index"
          />
        </div>
      </div>
    </template>
    <div class="pages">
      <div class="banner">
        <div class="arrow left" @click="prevImage">
          <van-icon name="arrow-left" />
        </div>
        <div class="avatarUser">
          <div class="avatarDiv">
            <img :src="currentImg" alt="" />
          </div>
          <p @click="submit">{{ $t("hint.h16") }}</p>
        </div>
        <div class="arrow right" @click="nextImage">
          <van-icon name="arrow" />
        </div>
      </div>
      <div class="avatarBox">
        <div
          :class="`item ${active == item.id ? 'act' : ''}`"
          v-for="(item, index) of avatar"
          :key="index"
          @click="chooseVal(item)"
        >
          <img :src="item.img" alt="" />
        </div>
      </div>
    </div>
  </van-skeleton>
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
.pages {
  padding: 50px 20px;
  .banner {
    padding: 6px 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(50% 50% at 50% 50%, #11227c 0%, #00020f 100%);
    .arrow {
      width: 30px;
      height: 30px;
      position: absolute;
      border-radius: 50%;
      border: 2px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      i {
        font-size: 22px;
      }
    }
    .left {
      left: 10px;
    }
    .right {
      right: 10px;
    }
    .avatarUser {
      .avatarDiv {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        overflow: hidden;
      }
      img {
        width: 100%;
        height: 100%;
      }
      p {
        display: flex;
        width: max-content;
        padding: 4px 24px;
        justify-content: center;
        align-items: center;
        gap: 10px;
        border-radius: 500px;
        background: #636ff1;
        margin: 10px auto 0;
      }
    }
  }
  .avatarBox {
    width: 100%;
    margin: 10px 0 0;
    display: grid;
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    grid-template-columns: repeat(5, 1fr);
    .item {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      img {
        width: 100%;
      }
    }
    .act {
      border-radius: 10px;
      border: 4px solid #fff;
      box-shadow: 0px 0px 20px 0px #c9bdff;
    }
  }
}
.skeletonBox {
  width: 100%;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .skeletonAvatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    overflow: hidden;
  }
  .skeletonImg {
    width: 100%;
    margin: 10px 0 0;
    display: grid;
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    grid-template-columns: repeat(5, 1fr);
    .item {
      width: 100%;
      margin: 0;
      height: 60px;
      border-radius: 8px;
    }
  }
}
</style>