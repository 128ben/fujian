<template>
  <div class="pages">
    <div class="tabs">
      <!-- <van-tabs line-width="70px" v-model:active="tabIndex" @change="tabChange">
        <van-tab v-for="(item, index) of arr" :key="index" :title="item.name">  -->
      <van-empty description="No data yet" v-if="list.length < 1&&!loading" />
      <div class="itemBox" v-else>
        <div class="betFilter"></div>
        <div class="betList">
          <van-list v-model:loading="loading" :finished="finished" finished-text="No more" :immediate-check="false"
            @load="onLoad">
            <div class="item" :class="index % 2 === 0 ? 'even' : 'odd'" v-for="(item, index) of list" :key="index">
              <div v-if="item.status == -1" class="voidImg">
                <img :src="voidImg" alt="">
                <p>{{ $t('game0.g9') }}</p>
              </div>
              <div v-else class="voidImg">
                <img :src="voidImg" alt="">
                <p :style="`color: ${item.status!=2 ? '#fff' : item.amount_net>0 ? '#52FF00' : item.amount_net<0?'#FF5959':'#fff'}` ">
                  {{item.status!=2?statusObj[item.status]:item.amount_net>0?$t('betting0.b8'):item.amount_net<0?$t('betting0.b10'):$t('betting0.b11')}}
                </p>
              </div>
              <div class="item_row">
                <div class="row_div">
                  <p>{{ $t("betting0.b1") }}:<span>{{ Number(item.rate_of_return) * 100 }}%</span></p>
                  <p>货币:<span>{{ item.buy_currency }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b2") }}:<span>{{ item.amount }}</span></p>
                  <p>交易ID:<span>{{ item.id }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b3") }}: <span>{{ item.amount_net }}</span></p>
                  <p>买入:<span>{{ item.buy_type == 1 ? '涨' : '跌' }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b4") }}:<span>{{ item.open_price }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b5") }}:<span>{{ item.end_price }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b6") }}:<span>{{ item.created_at }}</span></p>
                </div>
                <div class="row_div">
                  <p>{{ $t("betting0.b6") }}:<span>{{ item.handled_at }}</span></p>
                </div>
              </div>
            </div>
          </van-list>
        </div>
      </div>
      <!-- </van-tab>
      </van-tabs> -->
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from "vue";
import { betHistoryApi } from "@/utils/api";
import { useUserStore } from "@/store/useUserStore";
import { message } from "ant-design-vue";
import voidImg from "@/assets/img/void.png"
const [messageApi, contextHolder] = message.useMessage();
const userStore = useUserStore();
const tabIndex = ref(0);
const tabsList = ref([
  {
    title: "",
  },
  {
    title: "",
  },
  {
    title: "",
  },
]);
let arr = JSON.parse(localStorage.getItem('gameName'))
// arr.forEach((item, index) => {
//   tabsList.value[index].title = item.name
// });
const statusObj = {
  0: "未开奖", //进行中
  1: "未开奖",//进行中
  2: "已完成",//已完成
  3: "作废",//作废
}
const pageSet = reactive({
  pageIndex: 1,
  pageSize: 20,
});
const loading = ref(true);
const finished = ref(false);
const onLoad = () => {
  pageSet.pageIndex++;
  getData();
};
const list = ref([]);
const getData = async () => {
  messageApi.loading("Loading...");
  try {
    const res = await betHistoryApi({
      size: pageSet.pageSize,
      page: pageSet.pageIndex,
      amountType: userStore.userInfo.amountType
    });
    if (res.success) {
      if (res.data.list.length == 0) {
        finished.value = true;
      } else {
        list.value.push(...res.data.list);
        console.log(list.value);
        loading.value = false;
      }
      // 检查是否加载完成
      if (list.value.length >= res.data.count) {
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
</script>


<style lang="scss" scoped>
.pages {
  padding: 5px 10px 20px;

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
          &>p:first-child {
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
          }

          &>p:last-child {
            font-size: 26px;
            font-weight: 700;
            text-transform: uppercase;
          }
        }
      }
    }

    .betList {
      .item {
        width: 100%;
        display: flex;
        padding: 6px 12px;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        background: #1e293b;
        margin: 10px 0;
        border-radius: 12px;
        font-size: 14px;
        position: relative;

        .voidImg {
          position: absolute;
          width: 80px;
          bottom: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;

          img {
            width: 100%;
          }

          p {
            position: absolute;
            transform: rotate(-7deg);
            display: inline-block;
            color: rgb(214, 27, 27);
            font-weight: bold;
          }
        }

        .item_row {
          color: rgba(255, 255, 255, 0.6);
          width: 100%;


          .row_div {
            display: flex;
            align-items: center;
            margin: 6px 0;
            display: flex;
            justify-content: space-between;

            p {
              // flex: 1;
            }
          }

          span {
            color: #fff;
            margin: 0 0 0 4px;
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

:deep(.van-tab__text--ellipsis) {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
  -webkit-box-orient: unset;
  font-size: 14px;
  text-align: center;
}

:deep(.van-tabs__line) {
  bottom: 15px !important;
}

:deep(.van-tab) {
  line-height: 1.1;
}
</style>