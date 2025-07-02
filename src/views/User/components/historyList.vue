<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { historyApi } from "@/utils/api";
import { message } from "ant-design-vue";
const [messageApi, contextHolder] = message.useMessage();
const activeKey = ref(0);
const tabsList = ref([
  {
    title: "user0.u25",
  },
  {
    title: "user0.u26",
  },
]);
const pageSet = reactive({
  pageIndex: 1,
  pageSize: 100,
});
const list = ref([]);
const filterType = ref(1);
const filterStatus = ref("");
const filterdate = ref("");
const loading = ref(false);
const finished = ref(false);
const onLoad = () => {
  pageSet.pageIndex++;
  getData();
};
const getData = async () => {
  messageApi.loading("Loading...");
  try {
    const res = await historyApi({
      type: filterType.value,
      status: filterStatus.value,
      day_type: filterdate.value,
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
// 切换标签时的处理
const tabChange = (e) => {
  filterType.value = e + 1;
  pageSet.pageIndex = 1;
  list.value = [];
  getData();
};
// 初始加载数据
onMounted(() => {
  getData();
});
</script>

<template>
  <context-holder />
  <div class="tabs">
    <a-tabs v-model:activeKey="activeKey" @change="tabChange">
      <a-tab-pane
        v-for="(item, index) of tabsList"
        :key="index"
        :tab="$t(item.title)"
      >
        <div class="itemBox">
          <div class="betFilter"></div>
          <div class="betList">
            <van-list
              v-model:loading="loading"
              :finished="finished"
              finished-text="No more"
              :immediate-check="false"
              @load="onLoad"
            >
              <div v-for="item in list" :key="item" class="item">
                <p>{{ item.created_at }}</p>
                <p>{{ item.status }}</p>
                <p>{{ item.amount }}</p>
                <p>{{ item.service_fees }}</p>
              </div>
            </van-list>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
<style lang="scss" scoped>
.tabs {
  width: 100%;
  padding: 0 10px 10px;
  .ant-tabs {
    color: $textColor;
  }
  .itemBox {
    width: 100%;
  }
  .betList {
    width: 100%;
    height: 84vh;
    overflow: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    .item {
      width: 100%;
      display: flex;
      padding: 12px 6px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      p {
        flex: 1;
        text-align: center;
      }
    }
  }
}
</style>