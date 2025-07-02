<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { 
  // fundsApi

 } from "@/utils/api";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/useUserStore";
import { message } from "ant-design-vue";
const [messageApi, contextHolder] = message.useMessage();
const userStore = useUserStore();
const { t } = useI18n();
const router = useRouter();
const tabIndex = ref(0);
const tabsList = ref([
  {
    title: t("invite0.i22"),
  },
  {
    title: t("invite0.i23"),
  },
]);

//筛选
const status = ref(1);
const day_type = ref(1);
const option1 = [
  { text: t("hint.h6"), value: 0 },
  { text: t("hint.h4"), value: 1 },
  { text: t("hint.h5"), value: 2 },
];
const option2 = [
  { text: t("hint.h7"), value: 1 },
  { text: t("hint.h8"), value: 2 },
  { text: t("hint.h9"), value: 3 },
  { text: t("hint.h10"), value: 4 },
  { text: t("hint.h11"), value: 5 },
  { text: t("hint.h12"), value: 6 },
];
const statusFun = (e) => {
  list.value = [];
  pageSet.pageIndex = 1;
  getData();
};
const day_typeFun = (e) => {
  pageSet.pageIndex = 1;
  list.value = [];
  getData();
};
const pageSet = reactive({
  pageIndex: 1,
  pageSize: 100,
});
const loading = ref(false);
const finished = ref(false);
const onLoad = () => {
  pageSet.pageIndex++;
  getData();
};
const list = ref([]);
const getData = async () => {
  messageApi.info("Loading...", 1);
  try {
    const res = await fundsApi({
      type: tabIndex.value + 1,
      status: status.value,
      day_type: day_type.value,
      page: pageSet.pageIndex,
      limit: pageSet.pageSize,
    });
    if (res.success) {
      if (res.data.list.length == 0) {
        finished.value = true;
      } else {
        list.value.push(...res.data.list);
        loading.value = false;
      }
      // 检查是否加载完成
      if (list.value.length >= res.data.total) {
        finished.value = true;
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};
const tabChange = (e) => {
  pageSet.pageIndex = 1;
  list.value = [];
  getData();
};
// 初始加载数据
onMounted(() => {
  getData();
});
const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <context-holder />
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t("invite0.i24") }}</p>
  </div>
  <div class="pages">
    <div class="tabs">
      <van-tabs line-width="70px" v-model:active="tabIndex" @change="tabChange">
        <van-tab
          v-for="(item, index) of tabsList"
          :key="index"
          :title="item.title"
        >
          <div class="betFilter">
            <van-dropdown-menu>
              <van-dropdown-item
                v-model="status"
                :options="option1"
                @change="statusFun"
              />
              <van-dropdown-item
                v-model="day_type"
                :options="option2"
                @change="day_typeFun"
              />
            </van-dropdown-menu>
          </div>
          <van-empty description="No data yet" v-if="list.length < 1" />
          <div class="itemBox" v-else>
            <div class="betList">
              <van-list
                v-model:loading="loading"
                :finished="finished"
                finished-text="No more"
                :immediate-check="false"
                @load="onLoad"
              >
                <div class="flexTitle">
                  <p>{{ $t("invite0.h13") }}</p>
                  <p>{{ $t("invite0.h14") }}</p>
                  <p>{{ $t("invite0.h15") }}</p>
                </div>
                <div
                  class="item"
                  :class="index % 2 === 0 ? 'even' : 'odd'"
                  v-for="(item, index) of list"
                  :key="index"
                >
                  <div class="item_row">
                    <p>{{ item.created_at }}</p>
                    <p>{{ item.amount }}</p>
                    <p>{{ item.service_fees }}</p>
                  </div>
                </div>
              </van-list>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.pages {
  padding: 44px 10px 20px;
  .tabs {
    .itemBox {
      margin: 10px 0 0;
      .betInfo {
        width: 100%;
        display: flex;
        padding: 12px 28px;
        justify-content: space-between;
        align-items: center;
        border-radius: 10px;
        background: #072134;
        // background-image: url("@/assets/img/betBG.png");
        // background-repeat: no-repeat;
        // background-size: cover;
        .itemInfo {
          & > p:first-child {
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
          }
          & > p:last-child {
            font-size: 26px;
            font-weight: 700;
            text-transform: uppercase;
          }
        }
      }
    }
    .betList {
      .flexTitle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        p {
          flex: 1;
          text-align: center;
        }
      }
      .item {
        flex: 1;
        display: flex;
        padding: 6px 0;
        justify-content: space-between;
        background: #1e293b;
        margin: 10px 0;
        border-radius: 8px;
        font-size: 14px;
        .item_row {
          color: rgba(255, 255, 255, 0.6);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: center;
          p {
            flex: 1;
          }
        }
      }
    }
  }
}
.item.even {
  animation: slide-left-right 0.6s;
}

.item.odd {
  animation: slide-right-left 0.6s;
}
:deep(.van-cell) {
  background: $bgColor !important;
  color: rgba(255, 255, 255, 0.6);
}
:deep(.van-dropdown-item__option--active) {
  color: #fff;
}
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
</style>