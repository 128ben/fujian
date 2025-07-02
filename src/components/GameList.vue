<script lang="ts" setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from "vue";
import { message } from "ant-design-vue";
import { HomeApi, userApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
const userStore = useUserStore();
const { t } = useI18n();
const gameList = ref([]);
const intervalId = ref(null);
const intervalFun = ref(null);
const loading = ref(true);
const route = useRoute();
const router = useRouter();
// 格式化时间
const formatTime = (seconds, type) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${type == 1 ? t('game0.g6') : ""}${minutes}:${secs < 10 ? "0" : ""
    }${secs}`;
};
onMounted(() => {
  getData();
  if (userStore.token != null) {
    getUserInfo();
  }
  intervalFun.value = setInterval(() => {
    getData();
  }, 10000);
});
const userInfo = ref({});
const getData = async () => {
  try {
    const res = await HomeApi({
      url:location.hostname
    });
    if (res.success) {
      gameList.value = res.data.game_list;
      loading.value = false;
      localStorage.setItem('gameName', JSON.stringify(res.data.game_list))
      // 启动倒计时
      startCountdown();
    }
  } catch (error) {
    clearInterval(intervalId.value);
    setTimeout(() => {
      // getData();
    }, 1000);
  }
};
const getUserInfo = async () => {
  try {
    const res = await userApi({});
    if (res.success) {
      userInfo.value = res.data;
      userStore.setUserInfo(res.data);
    }
  } catch (error) { }
};
// 启动倒计时
const startCountdown = () => {
  clearInterval(intervalId.value);
  intervalId.value = setInterval(() => {
    gameList.value.forEach((game) => {
      if ((game.status == 0 || game.status == 1) && game.seconds > 0) {
        game.seconds--;
        if (game.seconds < 1) {
          getData();
        }
      } else if (game.status == 2 || game.status == 3 || game.status == 4) {
      } else {
        getData();
      }
    });
  }, 1000);
};
const getClass = (type: Number) => {
  switch (type) {
    case 0:
      return "proceed";
    case 1:
      return "finish";
    case 2:
      return "finish";
    case 3:
      return "finish";
    case 4:
      return "wait";
  }
};
const getStatusText = (type: Number) => {
  switch (type) {
    case 0:
      return t("game0.g43");
    case 1:
      return t("game0.g6");
    case 2:
      return t("game0.g7");
    case 3:
      return t("game0.g44");
    case 4:
      return t("game0.g9");
    default:
      return "";
  }
};
const gotoGame = (id: number, code: string) => {
  // 房间内切换
  if (route.path.slice(0, 5) == '/Game') {
    router.push(`/GamePages/${id}/${code}`);
    setTimeout(() => {
      location.reload()
    }, 500);
  }
  // 正常跳转
  if (userStore.token != null) {
    router.push({
      name: "Game",
      params: { id, code },
    });
  } else {
    message.error(t("hint.h26"));
  }
};
// 组件卸载时清除计时器
onBeforeUnmount(() => {
  clearInterval(intervalId.value);
  clearInterval(intervalFun.value);
});
</script>

<template>
  <div class="pages">
    <van-skeleton :loading="loading">
      <!-- 骨架 -->
      <template #template>
        <div class="skeleton">
          <van-skeleton-paragraph v-for="item of 3" :key="item" class="skeletonList" />
        </div>
      </template>
      <div class="game">
        <div class="gameItem" v-for="(item, index) of gameList" :key="index" @click="gotoGame(item.id, item.game_code)">
          <div class="cover">
            <img :src="item.image" alt="" />
            <div class="gameInfo">
              <p :class="`${getClass(item.status)} gameTypeBtn`">
                {{
                  item.status == 0 || item.status == 1
                    ? formatTime(item.seconds, item.status)
                    : getStatusText(item.status)
                }}
              </p>
              <p class="gameName">{{ item.name }}</p>
            </div>
          </div>
          <div class="gameTitle">
            <p>{{ item.name }}</p>
            <p class="gamePlayBtn">PLAY</p>
          </div>
        </div>
      </div>
    </van-skeleton>
  </div>
</template>
<style lang="scss" scoped>
.pages {
  padding: 0px 20px;
  height: auto !important;
}

.game {
  width: 100%;

  .gameItem {
    width: 100%;
    margin: 10px 0;
    background-color: #2f4553;
    padding: 8px 12px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    animation: flip 0.6s;

    .cover {
      position: relative;
      margin: 0 0 10px 0;
      border: 3px solid #fff;
      border-radius: 10px;
      overflow: hidden;
      min-height: 110px;

      .winningNum {
        position: absolute;
        bottom: 5px;
        left: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      img {
        width: 100%;
        height: 100%;
      }

      .gameInfo {
        position: absolute;
        top: 0px;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 10px;

        .gameName {
          position: absolute;
          bottom: 1.5vh;
          font-weight: bold;
          font-size: 20px;
        }

        .gameTypeBtn {
          display: inline-flex;
          padding: 4px 20px;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          border-radius: 10px;
          font-weight: 700;
        }

        .finish {
          border: 1px solid #f00;
          background-color: rgba(255, 0, 0, 0.3);
        }

        .advance {
          border: 1px solid #f28482;
          background-color: rgb(242, 132, 130, 0.3);
        }

        .proceed {
          border: 1px solid #2fff00;
          background-color: rgba(111, 255, 0, 0.3);
        }

        .wait {
          border: 1px solid #04f;
          background-color: rgba(0, 68, 255, 0.3);
        }
      }
    }

    .gameTitle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .gamePlayBtn {
        display: flex;
        font-size: 16px;
        width: 100px;
        height: 30px;
        padding: 0px 23px;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        background: #636ff1;
        border-radius: 10px;
        font-weight: 700;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}

// 骨架
.van-skeleton {
  padding: 0;

  .skeleton {
    width: 100%;

    .skeletonList {
      height: 167px;
      border-radius: 10px;
      margin: 8px 0 0;
    }

    .van-skeleton-paragraph {
      background: #192134;
    }
  }
}
</style>