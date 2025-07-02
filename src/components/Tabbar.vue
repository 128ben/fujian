<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import shera from "@/assets/svg/nav_item0.svg";
import sheraA from "@/assets/svg/nav_item0A.svg";
import wallet from "@/assets/svg/nav_item1.svg";
import walletA from "@/assets/svg/nav_item1A.svg";
import home from "@/assets/svg/nav_item3.svg";
import homeA from "@/assets/svg/nav_item3A.svg";
import bet from "@/assets/svg/nav_item4.svg";
import betA from "@/assets/svg/nav_item4A.svg";
import user from "@/assets/svg/nav_item2.svg";
import userA from "@/assets/svg/nav_item2A.svg";

// 导航项定义
const navItems = ref([
  {
    label: "tabber.t1",
    icon: wallet,
    actIcon: walletA,
    path: "/Ranking",
  },
  {
    label: "tabber.t2",
    icon: shera,
    actIcon: sheraA,
    path: "/Invite",
  },
  {
    label: "tabber.t3",
    icon: home,
    actIcon: homeA,
    path: "/",
  },
  {
    label: "tabber.t4",
    icon: bet,
    actIcon: betA,
    path: "/Betting",
  },
  {
    label: "tabber.t5",
    icon: user,
    actIcon: userA,
    path: "/User",
  },
]);

// 使用路由
const router = useRouter();
const route = useRoute();

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path);
};

// 计算属性：检查底部导航栏是否可见
const isFooterVisible = computed(() => {
  const visibleRoutes = ["/Ranking", "/Invite", "/", "/Betting", "/User"];
  return visibleRoutes.includes(route.path);
});
</script>

<template>
  <div>
    <div style="height: 63px" v-if="isFooterVisible"></div>
    <div class="footer" v-if="isFooterVisible">
      <ul class="footer-list">
        <li
          v-for="item in navItems"
          :key="item.path"
          :class="{ act: route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          <img v-show="route.path !== item.path" :src="item.icon" alt="" />
          <img v-show="route.path === item.path" :src="item.actIcon" alt="" />
          <span>{{ $t(item.label) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 63px;
  z-index: 2;
  background: $boxColor;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .footer-list {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    li {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      img {
        width: 22px;
        height: 22px;
        margin: 0 0 4px 0;
      }
      span {
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        font-family: "Microsoft YaHei UI";
        font-size: 12px;
        font-weight: 400;
        text-transform: capitalize;
      }
    }
    .act {
      span {
        color: #fff;
      }
    }
  }
}
</style>