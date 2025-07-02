<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import { useUserStore } from "@/store/useUserStore";
import { rankApi } from "@/utils/api";
import gujia from "@/assets/img/gujia.png";
import top1 from "@/assets/svg/top1.svg";
import top2 from "@/assets/svg/top2.svg";
import top3 from "@/assets/svg/top3.svg";
const loading = ref(true);
const userStore = useUserStore();
const tabIndex = ref(0);
const tabChange = (e) => {
  loading.value = true;
  tabIndex.value = e;
  getData();
};
onMounted(() => {
  getData();
});
const data = ref([
  {
    "user_id": 10002452,
    "rank": 1,
    "username": "Edd Stroman MD",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party82.png",
    "score": "3,000.00"
  },
  {
    "user_id": 10002444,
    "rank": 2,
    "username": "Alisa Bernhard Jr.",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party32.png",
    "score": "2,949.00"
  },
  {
    "user_id": 10002453,
    "rank": 3,
    "username": "Lester Gislason",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party61.png",
    "score": "2,628.00"
  },
  {
    "user_id": 10002451,
    "rank": 4,
    "username": "Miss Suzanne Paucek",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party25.png",
    "score": "2,467.00"
  },
  {
    "user_id": 10002442,
    "rank": 5,
    "username": "Ms. Carrie Lowe",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party39.png",
    "score": "2,431.00"
  },
  {
    "user_id": 10002447,
    "rank": 6,
    "username": "Verda Macejkovic",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party29.png",
    "score": "2,236.00"
  },
  {
    "user_id": 10002450,
    "rank": 7,
    "username": "Leopoldo Ferry",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party44.png",
    "score": "1,978.00"
  },
  {
    "user_id": 10002436,
    "rank": 8,
    "username": "Prof. Buddy Steuber",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party9.png",
    "score": "1,668.00"
  },
  {
    "user_id": 10002449,
    "rank": 9,
    "username": "Sigrid Olson",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party33.png",
    "score": "1,667.00"
  },
  {
    "user_id": 10002437,
    "rank": 10,
    "username": "Vernie Miller",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party30.png",
    "score": "1,656.00"
  },
  {
    "user_id": 10002446,
    "rank": 11,
    "username": "Chesley Johnston",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party77.png",
    "score": "1,601.00"
  },
  {
    "user_id": 10002434,
    "rank": 12,
    "username": "Mrs. Crystal Yundt",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party37.png",
    "score": "1,526.00"
  },
  {
    "user_id": 10002443,
    "rank": 13,
    "username": "Mrs. Earnestine Satterfield",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party69.png",
    "score": "1,351.00"
  },
  {
    "user_id": 10002445,
    "rank": 14,
    "username": "Trever Cruickshank",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party22.png",
    "score": "1,233.00"
  },
  {
    "user_id": 10002441,
    "rank": 15,
    "username": "Theo O'Hara",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party12.png",
    "score": "1,126.00"
  },
  {
    "user_id": 10002438,
    "rank": 16,
    "username": "Dr. Makayla Corwin III",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party39.png",
    "score": "902.00"
  },
  {
    "user_id": 10002439,
    "rank": 17,
    "username": "Fabian Lockman",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party62.png",
    "score": "829.00"
  },
  {
    "user_id": 10002440,
    "rank": 18,
    "username": "Vallie O'Hara",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party73.png",
    "score": "797.00"
  },
  {
    "user_id": 10002448,
    "rank": 19,
    "username": "Walter Zieme",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party65.png",
    "score": "638.00"
  },
  {
    "user_id": 10002435,
    "rank": 20,
    "username": "Dr. Cassandre Senger V",
    "img": "https://image.win7777.xyz/bgimg/avatar/Vampy Party55.png",
    "score": "581.00"
  }
]);
const getData = async () => {
  try {
    // const res = await rankApi({
    //   type: tabIndex.value + 1,
    // });
    // if (res.success) {
    //   data.value = res.data.list;
      loading.value = false;
    // }
  } catch (error) { }
};
const tabsTitle = [
  {
    title: "ranking0.r2",
  },
  {
    title: "ranking0.r3",
  },
  {
    title: "ranking0.r4",
  },
];

// 计算属性，只返回前三项
const limitedList = computed(() => {
  return data.value.slice(0, 3);
});
const others = computed(() => data.value.slice(3)); // 获取后面的项
</script>

<template>
  <div class="pages">
    <div class="title">{{ $t("ranking0.r1") }}</div>
    <div>
      <van-tabs line-width="70px" v-model:active="tabIndex" @change="tabChange">
        <van-tab v-for="(item, index) of tabsTitle" :key="index" :title="$t(item.title)">
          <!-- 骨架 -->
          <van-skeleton :loading="loading">
            <template #template>
              <div class="skeleton">
                <div class="flex_skeleton">
                  <van-skeleton avatar class="skeletonImg" v-for="item of 3" :key="item">
                    <template #template>
                      <img :src="gujia" alt="" />
                    </template>
                  </van-skeleton>
                </div>
                <div class="flex_skeleton_list">
                  <van-skeleton-paragraph v-for="item of 10" :key="item" class="skeletonList" />
                </div>
              </div>
            </template>
            <div class="tabItemBox">
              <div class="top3">
                <div class="top3_item w-24">
                  <div class="top_rounded" v-if="limitedList[1]">
                    <img :src="limitedList[1].img" alt="" />
                    <img :src="top2" alt="" />
                  </div>
                  <div class="top_text" v-if="limitedList[1]">
                    <div>${{ limitedList[1].score }}</div>
                    <div>{{ limitedList[1].username }}</div>
                  </div>
                </div>
                <div class="top3_item w-[132px]">
                  <div class="top_rounded" v-if="limitedList[0]">
                    <img :src="limitedList[0].img" alt="" />
                    <img :src="top1" alt="" />
                  </div>
                  <div class="top_text" v-if="limitedList[0]">
                    <div>${{ limitedList[0].score }}</div>
                    <div>{{ limitedList[0].username }}</div>
                  </div>
                </div>
                <div class="top3_item w-20">
                  <div class="top_rounded" v-if="limitedList[2]">
                    <img :src="limitedList[2].img" alt="" />
                    <img :src="top3" alt="" />
                  </div>
                  <div class="top_text" v-if="limitedList[2]">
                    <div>${{ limitedList[2].score }}</div>
                    <div>{{ limitedList[2].username }}</div>
                  </div>
                </div>
              </div>
              <div class="OthersList">
                <div class="item" v-for="(item, index) of others" :key="index"
                  :class="index % 2 === 0 ? 'even' : 'odd'">
                  <div class="listInfo">
                    <div class="serial">{{ item.rank }}</div>
                    <img :src="item.img" alt="" />
                    <p>{{ item.username }}</p>
                  </div>
                  <p class="money">${{ item.score }}</p>
                </div>
              </div>
            </div>
          </van-skeleton>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>
<style lang="scss" scoped>
@import url("./index.scss");
</style>