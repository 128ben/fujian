<template>
  <LoginPop :isShow="loginShow" :type="loginType" @close="closeLogin" />
  <!-- <LangModal v-if="isLangShow" @LangFinish="closeLang" /> -->
  <div class="page-box">
    <!-- <Navbar /> -->
    <div class="top-box">
      <div class="navbar-box">
        <div class="left">
          <div class="left-con" v-if="userStore.token">
            <img src="@/assets/images/jinbi.gif" alt="">
            <div class="aumont">{{ userStore.userInfo.balance }}</div>
            <van-icon class="icon" name="arrow" />
          </div>
        </div>
        <div class="right">
          <div class="btnBox" v-if="!userStore.token">
            <a-button class="btn1" @click="openLogin(0)">{{ $t('hint.h23') }}</a-button>
            <a-button class="btn3" @click="openLogin(1)">{{ $t('hint.h24') }}</a-button>
          </div>
          <div class="balance" v-else @click="gotoCZ">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect width="26" height="26" rx="5" fill="#F4CC00" />
              <path
                d="M15.6245 8.83217H20.4362C20.6553 8.83217 20.8654 8.91506 21.0203 9.0626C21.1752 9.21014 21.2622 9.41025 21.2622 9.61891V11.9803H4.73779V9.61891C4.73779 9.41025 4.82483 9.21014 4.97974 9.0626C5.13466 8.91506 5.34478 8.83217 5.56386 8.83217H10.3755L11.3476 10.0132C11.3433 10.2224 11.383 10.4303 11.4641 10.6248C11.5453 10.8192 11.6663 10.9963 11.8202 11.1457C11.974 11.2951 12.1576 11.4137 12.3602 11.4948C12.5628 11.5758 12.7803 11.6175 13 11.6175C13.2197 11.6175 13.4372 11.5758 13.6398 11.4948C13.8424 11.4137 14.026 11.2951 14.1799 11.1457C14.3337 10.9963 14.4548 10.8192 14.5359 10.6248C14.6171 10.4303 14.6567 10.2224 14.6525 10.0132L15.6245 8.83217ZM21.2622 13.5532V19.0615C21.2622 19.2702 21.1752 19.4703 21.0203 19.6178C20.8654 19.7654 20.6553 19.8483 20.4362 19.8483H5.56386C5.34488 19.8483 5.13486 19.7655 4.97996 19.618C4.82506 19.4706 4.73796 19.2707 4.73779 19.0621V13.5538L21.2622 13.5532ZM6.38871 16.3077H10.933V14.7353H6.38871V16.3077Z"
                fill="#6A6212" />
              <path
                d="M11.9935 7.39318L11.9935 3.75648C12.0017 3.55321 12.0923 3.36088 12.2462 3.21983C12.4001 3.07879 12.6054 3 12.819 3C13.0326 3 13.2379 3.07879 13.3918 3.21983C13.5457 3.36088 13.6362 3.55321 13.6444 3.75648L13.6444 7.47296L15.1963 5.9944C15.3512 5.84683 15.5614 5.76392 15.7805 5.76393C15.9997 5.76393 16.2098 5.84683 16.3648 5.9944C16.5197 6.14198 16.6068 6.34213 16.6068 6.55083C16.6068 6.75953 16.5197 6.95968 16.3648 7.10725L13.4266 9.90557C13.1089 10.2081 12.6098 10.2081 12.2921 9.90557L9.35389 7.10725C9.19894 6.95968 9.11189 6.75953 9.11189 6.55083C9.11189 6.34213 9.19894 6.14198 9.35389 5.9944C9.50884 5.84683 9.719 5.76392 9.93813 5.76392C10.1573 5.76392 10.3674 5.84683 10.5224 5.9944L11.9935 7.39318Z"
                fill="#2E3007" />
            </svg>
          </div>

        </div>
      </div>
      <div class="top-eontent">
        <div class="left">
          <div class="line">
            {{ $t('newLang.a8') }}:<span>${{ placeOrderForm.amount }}</span>
          </div>
          <div class="line">
            {{ $t('newLang.a9') }}:<span class="pre">{{ interestRate * 100 }}%</span>
          </div>
          <div class="line">
            {{ $t('newLang.a10') }}:<span>${{ placeOrderForm.amount * interestRate }}</span>
          </div>
          <!-- <div class="name">{{ $t('newLang.a6') }}</div>
          <div class="val">{{ broadcast.buyUp || 0 }}%</div> -->
        </div>
        <div class="center">
          <CircularCountdown ref="countdownRef" :duration="currentExpirationAll" :startTime="currentExpiration" :colors="[
            { percent: 0.7, color: '#4CAF50' },
            { percent: 0.4, color: '#FFC107' },
            { percent: 0, color: '#F44336' }
          ]" :backgroundColor="'#e0e0e0'" :strokeWidth="5" :size="'90px'" @finish="onFinish">
            <div class="CircularCountdown-con">
              <ScaleLoader v-if="countdownRef?.formattedTime <= 0" :loading="true" color="#3FF100" :size="30" />
              <div
                :class="countdownRef?.formattedTime <= 10 ? 'times animation' : countdownRef?.formattedTime <= 100 ? 'times' : 'times2'"
                v-else>{{ countdownRef?.formattedTime || '0' }}</div>
              <div class="esc">ESC</div>
              <img className="addsec" @click="() => {
                if (buySells.length) {
                  isModalVisibleOrder = true
                } else {
                  message.info('暂无订单')
                }
              }" src="@/assets/images/addsec.png" alt="" />
            </div>
          </CircularCountdown>
        </div>
        <div class="right">
          <div class="con">
            <div class="jian" @click="decreaseTime">
              <img src="../../assets/images/jianjt.png" alt="">
            </div>
            <div class="zhong" @click="() => {
              if (isLogin()) {
                isVisibleTime = true
              }
            }">{{ convertSecondsToMinutes(placeOrderForm.expirationTime) }}</div>
            <div class="jian" @click="increaseTime">
              <img src="../../assets/images/jiajt.png" alt="">
            </div>
          </div>
          <p class="name">交易时间</p>
          <!-- <div class="name">{{ $t('newLang.a7') }}</div>
          <div class="val">{{ broadcast.buyDown || 0 }}%</div> -->
        </div>
      </div>
    </div>
    <div class="center-box">
      <a-spin v-if="isShow" tip="Loading..." class="loading" :spinning="isShow"> </a-spin>
      <div class="top">
        <div class="left" @click="typeClick()">
          <!-- <img src="@/assets/images/coin01.png" alt="" /> -->
          <span>{{ placeOrderForm.type }}</span>
          <van-icon name="arrow-down" style="font-size: 12px;color: #8296b2;" />
        </div>
      </div>
      <div class="chart" id="chartDom" ref="parentRef">
        <!-- <LineAreaChart v-if="parentHeight > 0 && showChart && echartsType !== 3" 
          :wh="parentRef?.clientWidth || window.innerWidth" 
          :ht="parentHeight" 
          ref="lineChart"
          :xScale="xScale" 
          :lastGap="lastGap" 
          :initData="initDataLine" 
          :generateNewDataPoint="genNew" 
          :interval="200"
          :generateNewNullXLabel="genNewNullTimestamp" 
          :insertDataToLeft="insertDataToLeft" 
          :minZoomScale="0.0000000001"
          :minX="-leftData.length"
          :maxDataPoints="50000"
          :enablePerformanceMonitor="true" /> -->
          <PriceChart 
            ref="priceChartRef"
            :realTimeData="chartRealTimeData"
            :currentPriceData="placeOrderForm.buyAmount"
            :useExternalData="true"
            :renderDelay="1000"
            :dataSourceId="placeOrderForm.type"
            :markerPoints="markerPoints"
            @markersRemoved="handleMarkersRemoved"
          />
      </div>
    </div>
    <div class="bottom-box">
      <div class="buy-box">
        <div class="up" @click="throttledEvent(1)">
          <div class="name">Buy UP</div>
        </div>
        <div class="down" @click="throttledEvent(2)">
          <div class="name">Buy Down</div>
        </div>
      </div>
      <div class="money-box">
        <div class="item" :class="{ active: v == placeOrderForm.amount }" v-for="v in moneyList" :key="v"
          @click="placeOrderForm.amount = v">
          <span class="unit">$</span>
          {{ v }}
        </div>
      </div>
      <div class="data-box" style="display: flex;justify-content: center;">
        <!-- <div class="left">
          <div class="line">
            {{ $t('newLang.a8') }}:<span>${{ placeOrderForm.amount }}</span>
          </div>
          <div class="line">
            {{ $t('newLang.a9') }}:<span class="pre">{{ interestRate * 100 }}%</span>
          </div>
          <div class="line">
            {{ $t('newLang.a10') }}:<span>${{ placeOrderForm.amount * interestRate }}</span>
          </div>
        </div>  -->
        <div class="right">
          <div class="line">
            <div class="jian" @click="jianAmount">
              <img src="@/assets/images/jian.png" alt="" />
            </div>
            <div class="mo" :class="{ active: popupShow }" @click="popupShow = true">
              <div class="val">${{ placeOrderForm.amount }}</div>
              <div class="msg">{{ $t('newLang.a11') }}</div>
            </div>
            <div class="jian" @click="jiaAmount">
              <img src="@/assets/images/jia.png" alt="" />
            </div>
          </div>
          <!-- <div class="line">
            <div class="jian" @click="decreaseTime">
              <img src="@/assets/images/jian.png" alt="" />
            </div>
            <div class="mo" @click="() => {
              if (isLogin()) {
                isVisibleTime = true
              }
            }">
              <div class="val">{{ convertSecondsToMinutes(placeOrderForm.expirationTime) }}</div>
              <div class="msg">{{ $t('newLang.a12') }}</div>
            </div>
            <div class="jian" @click="increaseTime">
              <img src="@/assets/images/jia.png" alt="" />
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
  <!-- 货币弹窗 -->
  <van-popup v-model:show="isModalVisible" style="background: rgba(0,0,0,0) !important;" closeable
    close-on-click-overlay>
    <div class="typePoup-custom-class2">
      <div class="title-txt">{{ $t('newLang.a13') }}</div>
      <div class="content-typePoup">
        <van-radio-group v-model="typeActive.name">
          <div v-for="v in currencyList" :key="v.name" class="line" @click="chengeType(v)">
            <div class="lf">{{ v.name }}</div>
            <div class="rg">
              {{ (v.interest_rate * 100) }}%
              <van-radio :name="v.name" class="radioName" />
            </div>
          </div>
        </van-radio-group>
      </div>
      <div class="btn" @click="handleChange">确定</div>
    </div>
  </van-popup>
  <!-- 交易时间弹窗 -->
  <van-popup v-model:show="isVisibleTime" :style="{
    height: 'auto',
    backgroundColor: '#000A23 !important',
    borderRadius: '12px',
  }">
    <div class="time-popup">
      <!-- 如果需要标题栏可以取消注释 -->
      <!-- <div class="title">
        交易时间
        <img @click="closePopup" src="/assets/images/close.png" alt="关闭" />
      </div> -->

      <div v-for="v in timesList" :key="v" class="item">
        <div class="lf">{{ placeOrderForm.type }}</div>
        <div class="center">{{ convertSecondsToMinutes(v) }}</div>
        <div class="btn" @click="selectTime(v)">
          选择
        </div>
      </div>
    </div>
  </van-popup>
  <!-- 进行中订单列表 -->
  <van-popup v-model:show="isModalVisibleOrder" round :close-on-click-overlay="true" closeable :overlay="true"
    class="typePoup-custom-class">
    <div class="popup-header">
      <span class="title">当前订单</span>
    </div>
    <div class="content-typePoup">
      <div v-for="v in buySells" :key="v.order.id" :class="v.buyType === 1 ? 'line' : 'line down'">
        <div class="item">
          <div class="na naup">{{ v.buyType === 1 ? 'Buy Up' : 'Buy Down' }}</div>
          <div class="val">
            {{ v.order.buy_currency.split('-')[0] }}
          </div>
        </div>
        <div class="item">
          <div class="na">剩余时间</div>
          <div v-if="v.expirationTime > 0" class="val-time">
            <div class="ts" v-for="(tPart, index) in formatSeconds(v.expirationTime)" :key="index">
              {{ tPart }}
            </div>
          </div>
          <div v-else class="val">结算中</div>
        </div>
        <div class="item">
          <div class="na">预计收益</div>
          <div class="val valsy">+${{ (v.order.amount * v.order.rate_of_return).toFixed(2) }}</div>
        </div>
        <div class="item">
          <div class="na">投注金额</div>
          <div class="val valje">${{ v.order.amount }}</div>
        </div>
      </div>
    </div>
  </van-popup>
  <!-- 赢弹窗 -->
  <van-dialog v-model:show="winShow"
    style="border-radius: 8px;border: 1px solid rgba(255, 255, 255, 0.10);background: rgba(0, 33, 44, 0.50) !important;backdrop-filter: blur(15px);"
    :showConfirmButton="false" close-on-click-overlay>
    <template v-slot:title>
      <div class="title-dialog1">you win
        <img class="closeImg" src="@/assets/images/closetc.png" @click="winShow = false" alt="">
      </div>
      <div class="amout-box">
        <span>恭喜本轮赢得</span>
        <span class="amount">${{ orderData.amount_net }}</span>
      </div>
    </template>
    <div class="className-dialog">
      <div class="con-tc" ref="vapDom">
        <!-- <img src="@/assets/images/guang.png" alt="" class="img1" />
        <img class="img2" src="@/assets/images/youwin.gif" alt="" /> -->
      </div>
      <div class="price-box">
        <div class="line">
          <span>开始价格:{{ orderData.open_price }}</span>
          <span>Trend</span>
        </div>
        <div class="line">
          <span>开始价格:{{ orderData.end_price }}</span>
          <p>
            <span class="val" v-if="orderData.buy_type">BUY UP</span>
            <span class="val2" v-else>BUY DOWN</span>
          </p>
        </div>
      </div>
    </div>
  </van-dialog>
  <!-- 输弹窗 -->
  <van-dialog v-model:show="lostShow"
    style="border-radius: 8px;border: 1px solid rgba(255, 255, 255, 0.10);background: rgba(0, 33, 44, 0.50) !important;backdrop-filter: blur(15px);"
    :showConfirmButton="false" close-on-click-overlay>
    <template v-slot:title>
      <div class="title-dialog2">you lost
        <img class="closeImg" src="@/assets/images/closetc.png" @click="lostShow = false" alt="">
      </div>
    </template>
    <div class="className-dialog2">
      <div class="con-tc">
        <img src="@/assets/images/youlost.gif" alt="" />
        <!-- <div class="txt-tc">
          <div class="left">
            <div class="name">Trend</div>
            <div class="val" v-if="orderData.buy_type">BUY UP</div>
            <div class="val2" v-else>BUY DOWN</div>
          </div>
          <div class="right">
            <div class="name">金额</div>
            <div class="val">${{ orderData.amount }}</div>
          </div>
        </div> -->
      </div>
      <div class="price-box">
        <div class="line">
          <span>金额: ${{ orderData.amount }}</span>
          <!-- <span>${{ orderData.amount }}555</span> -->
        </div>
        <div class="line">
          <span>开始价格:{{ orderData.open_price }}</span>
          <span>Trend</span>
        </div>
        <div class="line">
          <span>开始价格:{{ orderData.end_price }}</span>
          <p>
            <span class="val" v-if="orderData.buy_type">BUY UP</span>
            <span class="val2" v-else>BUY DOWN</span>
          </p>
        </div>

      </div>
      <div class="con2-tc">
        <div class="name">再接再厉，再来一轮</div>
      </div>
    </div>
  </van-dialog>
  <van-dialog v-model:show="drawShow"
    style="border-radius: 8px;border: 1px solid rgba(255, 255, 255, 0.10);background: rgba(0, 33, 44, 0.50) !important;backdrop-filter: blur(15px);"
    :showConfirmButton="false" close-on-click-overlay>
    <template v-slot:title>
      <div class="title-dialog3">draw
        <img class="closeImg" src="@/assets/images/closetc.png" @click="drawShow = false" alt="">
      </div>
    </template>
    <div class="className-dialog3">
      <div class="con-tc">
        <img src="@/assets/images/draw.gif" alt="" />
      </div>
      <!-- <div class="con2-tc">
          本局下注金$50已返还
        </div>  -->
    </div>
  </van-dialog>
  <!-- 数字键盘 -->
  <numericKeypad :popupShow="popupShow" @change="checkmarkemptyChange" @popup_close="popupCloseNumericKeypad" />
</template>
<script setup>
import Vap from 'video-animation-player'
import video from "@/utils/vap/video.mp4"
import vapc from "@/utils/vap/vapc.json"
import numericKeypad from "@/components/numericKeypad.vue"
import { showDialog, showConfirmDialog } from 'vant';
import ScaleLoader from '@/components/ScaleLoader.vue';
import { message } from "ant-design-vue";
import CircularCountdown from '../../components/CircularCountdown.vue'
import { convertSecondsToMinutes, throttle } from '@/utils/fun.js';
import { HomeApi, placeOrder } from "@/utils/api";
import WebSocketClient from '@/utils/WebSocketClient.js';
import PriceChart from "../../components/ChatPixi/PriceChart.vue"
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick, computed, onActivated } from "vue";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useRoute } from "vue-router";
import LoginPop from "@/views/Login/index.vue";
import { useI18n } from "vue-i18n";
defineOptions({
  name: 'ChartPage'
});
const { t } = useI18n();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const isShow = ref(true);

// PriceChart 相关数据
const priceChartRef = ref(null);
const chartRealTimeData = ref([]);
const chartDataBuffer = ref([]); // 数据缓冲区，用于批量传递给图表组件
const isFirstRender = ref(true); // 添加标志位，标记是否为第一次渲染

// 标记点数据
const markerPoints = ref([]);

// 首页数据
const currencyList = ref([]);
const placeOrderForm = ref({
  amountType: computed(() => userStore.userInfo ? userStore.userInfo.amountType : 1), //金额类型：1：金币，2：真实金额
  amount: 50, //下单金额
  buyType: 1, //购买类型：1：买涨，2：买跌
  type: "BTC-USDT", //下单类型：BTC-USD,ETH-USD,TON-USD,等等
  expirationTime: 30, //交易期限（秒）
  strikeTime: undefined, //购买时间（时间戳）
  buyAmount: 1 //当前价格
});
const typeActive = ref(null);
const timesList = ref([]);
const interestRate = ref(0);
const typeRef = ref(placeOrderForm.value.type)
const echartsType = 2
const ycArr = [] //造假的数据
let newTs = 0
const isPlaying = ref(false); // 控制倒计时是否播放
const currentExpiration = ref(10) //用于存储当前的倒计时时长
const currentExpirationAll = ref(10) // 用于存储当前的倒计时总时长
const isModalVisibleOrder = ref(false);// 进行中订单列表弹窗
// 监听 placeOrderForm 的变化并同步  切换数据源
watch(
  () => placeOrderForm.value.type,
  (newVal, oldVal) => {
    console.log(`数据源切换检测: ${oldVal} -> ${newVal}`);
    
    typeRef.value = placeOrderForm.value.type;
    showChart.value = false;
    realTimeData.value = [];
    canUpdate = false;
    
    // 清理图表数据缓冲区
    clearChartDataBuffer();
    
    // 重置第一次渲染标志位
    isFirstRender.value = true;
    
    // 保存当前的标记点数据（如果需要在切换后恢复）
    const currentMarkers = [...markerPoints.value];
    
    // 清除标记点
    markerPoints.value = [];
    
    // 重置图表组件
    if (priceChartRef.value) {
      console.log('重置PriceChart组件');
      priceChartRef.value.resetChart();
      priceChartRef.value.clearMarkers();
    }
    
    // 如果有活跃的订单，在数据源切换后可能需要重新添加标记点
    // 这里可以根据业务需求决定是否保留标记点
    if (currentMarkers.length > 0) {
      console.log(`数据源切换，清理了 ${currentMarkers.length} 个标记点`);
    }
    
    console.log(`发送新的WebSocket订阅请求: ${newVal}`);
    send();
  }
);
// 走势图
// 控制图表加载折线，
const showChart = ref(false)
const lineChart = ref()
let xScale = 80;
let lastGap = 30;
// 主要存数据的变量
const data = ref([]);
// 存放除了首屏数据之外的剩余数据，用于图表右侧
const leftData = ref([]);
// 接口给的数据
const realTimeData = ref([])
let canUpdate = true
// 用于给组件初始化数据的函数,输入数据返回一个函数
const initFunc = (data) => {
  return (xScale, lastGap) => {
    const exisData = data.slice(-(xScale - lastGap))
    const lastTimestamp = exisData[exisData.length - 1].label
    // console.log(exisData);
    return exisData.concat(Array.from({
      length: lastGap
    }, (_, i) => ({
      y: null,
      hasMarker: false,
      label: lastTimestamp + 500 * (i)
    }))).map((d, i) => ({
      ...d,
      x: i,
    }))
  }
}
const initDataLine = ref()
// 获取新数据的逻辑
const genNew = (currentX, item) => (lastItem) => {
  // 如果推送了数据过来且没用完，则取出首部的数据
  if (realTimeData.value.length) {
    const r = realTimeData.value.shift();
    newTs = r.label
    return {
      y: r.y,
      label: r.label
    }
  }
  // console.log('use last item data')
  // 没有任何推送数据的话就是用上一个数据
  newTs = item.label + 500
  return {
    y: item.y,
    label: item.label + 500
  }
};
// 在图表左侧添加数据
const insertDataToLeft = () => (x) => {
  // 剩余多少条时加载历史数据
  if (leftData.value.length == 2000) {
    let period_end = leftData.value[0].label
    let period_start = leftData.value[0].label - 500 * 5000
    wsTy[wsUse].args = {
      "action": "subscribeHistory",
      "chain": placeOrderForm.type,
      "period_start": period_start,
      "period_end": period_end
    }
    // Toast.show({
    //   icon: 'loading',
    //   content:"加载中…",
    //   duration: 0
    // })
    send()
  }
  // 如果存在剩余数据，则先取剩余数据
  if (leftData.value.length) {
    const d = leftData.value.pop();
    return {
      x: x - 1,
      y: d.y,
      hasMarker: false,
      label: d.label
    };
  }
  // Toast.show({
  //   content: "没有更多了",
  // })
  // 如果没有则通过后台获取数据
  return null
}
watch(realTimeData.value.length, (val) => {
  // console.log(val.length, 'watch')
  if (realTimeData.value.length > 2 && parentHeight.value > 0 && showChart.value && echartsType != 3) {
    console.log('catch up')
    lineChart.value.catchUp(realTimeData.value.slice(0, realTimeData.value.length - 2));
    realTimeData.value = realTimeData.value.slice(-2);
  }
}, {
  deep: true
})
const genNewNullTimestamp = () => (lastTimestamp) => lastTimestamp + 500
// 走势图end
// 行情数据 WebSocket
const loadingdom = ref(null)
let timer = null
let allTimer = null
let ws = null
const wsTy = [{
  wsurl: "wss://socket.mcoinoption.com/ws",
  // wsurl: "wss://so.rbgoption.com/ws", 
  // wsurl: "wss://" + getDomain() + "/ws",
  args: {
    "action": "subscribeCandles",
    "chain": "BTC-USDT",
    "timeframes": 1
  }
}]
let wsUse = 0
const chartDom = ref(null) //line子组件
let prev = null
let isCloseWebSocket = true
function createWebSocket() { //数据获取
  showChart.value = false
  // 创建 WebSocketClient 实例
  ws = new WebSocketClient(wsTy[wsUse].wsurl, true, 20000, JSON.stringify({
    "action": "ping",
  }));
  // 添加事件监听器
  ws.on('open', () => {
    send()
  });
  ws.on('message', (res) => {
    const obj = JSON.parse(res);
    if (obj.success == 200) {
      if (obj.data.type == 'history') {
        // console.log(`接收到${obj.data.info[0]?.chain || 'unknown'}的历史数据:`, obj.data.info.length, '条');
        
        data.value = obj.data.info.map(d => {
          return {
            y: Number(d.amount), // 转换成数字
            label: d.ts, // 时间戳
            hasMarker: false, // 是否有标记
          }
        })
        
        // 第一次渲染时不将历史数据添加到图表缓冲区
        if (!isFirstRender.value) {
          // 将历史数据也添加到图表
          const historyDataForChart = obj.data.info.map(d => ({
            timestamp: d.ts,
            price: Number(d.amount),
            volume: Math.floor(Math.random() * 10000),
            label: d.ts,
            y: Number(d.amount),
            source: typeRef.value // 添加数据源标识
          }));
          
          // console.log(`准备添加${historyDataForChart.length}条历史数据到图表`);
          
          // 批量添加历史数据到图表
          historyDataForChart.forEach(dataPoint => {
            addDataToChartBuffer(dataPoint);
          });
        } else {
          console.log(`第一次渲染，跳过历史数据添加到图表，历史数据条数: ${obj.data.info.length}`);
        }
        
        // 获取首屏以外的数据
        leftData.value = data.value.slice(0, -(xScale - lastGap));
        initDataLine.value = initFunc(data.value)
        showChart.value = true
        canUpdate = true
        isShow.value = false
        
        // 标记第一次渲染完成
        isFirstRender.value = false;
        
        // console.log(`${typeRef.value}历史数据加载完成，开始接收实时数据`);
      } else if (obj.data.type == 'realTimeNotify') { //|| obj.data.type == 'realTimeNotifyKline'
        // console.log("WebSocket最新数据:", obj.data);
        let d = obj.data.info
        // console.log(`数据链类型: ${d.chain}, 当前选择: ${typeRef.value}, 匹配: ${typeRef.value == d.chain}`);
        
        if (canUpdate && typeRef.value == d.chain) {
          // console.log(`处理${d.chain}的实时数据:`, d);
          
          // 改数据
          if (ycArr.length) {
            ycArr.sort((a, b) => a.strikeTime - b.strikeTime)
            let item = ycArr[0]
            // console.log(item.strikeTime,d.ts);
            // console.log(item.strikeTime == d.ts);
            if (item.strikeTime == d.ts) {
              // console.log('改变数据的时间', d.ts);

              if (item.order.open_price > d.idxPx != item.order.open_price > item.end_price) {
                d.idxPx = item.end_price
                console.log(`修改${d.chain}数据价格为:`, d.idxPx);
                
                // 添加数据到图表缓冲区
                addDataToChartBuffer({
                  timestamp: d.ts,
                  price: Number(d.idxPx),
                  volume: Math.floor(Math.random() * 10000),
                  label: d.ts,
                  y: Number(d.idxPx),
                  idxPx: d.idxPx,
                  source: d.chain
                });
                realTimeData.value.push({
                  y: Number(d.idxPx), // 转换成数字
                  label: d.ts, // 时间戳
                  hasMarker: false, // 是否有标记
                });
              }
              ycArr.shift()
              // console.log('变');
              setTimeout(() => {
                userStore.setUserInfo(item.balance, 'balance')
                orderData.value = item.order
                if (item.order.amount_net > 0) {
                  winShow.value = true
                } else if (item.order.amount_net < 0) {
                  lostShow.value = true
                } else {
                  drawShow.value = true
                }
                deleteBuySell(item.order.id)
              }, 900)
            }
          } else {
            if (prev && new Date().getTime() - prev > 400) {
              // console.log(`添加${d.chain}实时数据到图表:`, {
              //   timestamp: d.ts,
              //   price: Number(d.idxPx),
              //   chain: d.chain
              // });
              
              // 添加数据到图表缓冲区
              addDataToChartBuffer({
                timestamp: d.ts,
                price: Number(d.idxPx),
                volume: Math.floor(Math.random() * 10000),
                label: d.ts,
                y: Number(d.idxPx),
                idxPx: d.idxPx,
                source: d.chain
              });
              realTimeData.value.push({
                y: Number(d.idxPx), // 转换成数字
                label: d.ts, // 时间戳
                hasMarker: false, // 是否有标记
              });
            }
            prev = new Date().getTime()
          }
          // console.log(d, 'websocket');

          // 改数据end
          placeOrderForm.value.buyAmount = Number(d.idxPx)
        } else {
          console.log(`忽略${d.chain}数据 - canUpdate: ${canUpdate}, 类型匹配: ${typeRef.value == d.chain}`);
        }
      } else if (obj.data.type == 'historyOld') { //请求历史数据
        let arr = obj.data.info.map((d, i) => {
          return {
            y: Number(d.amount), // 转换成数字
            label: d.ts, // 时间戳
            hasMarker: false, // 是否有标记
          }
        })
        // 获取首屏以外的数据
        leftData.value = arr.concat(leftData.value);
        // Toast.clear()
      }
    }
  });
  ws.on('close', (event) => {
    // console.log('WebSocket 已关闭:', event.reason)
    // popup_tbfgConfirm(charData.echartsType)
    if (isCloseWebSocket) {
      createWebSocket()
    }
  });
  ws.on('error', (error) => {
    ws.disconnect()
  });
  // 连接到 WebSocket 服务器
  ws.connect();
}
function send() {
  let args = wsTy[wsUse].args
  args.chain = typeRef.value
  args.timeframes = 1
  
  const msg = JSON.stringify(args);
  // console.log(`发送WebSocket消息:`, args);
  // console.log(`消息内容:`, msg);
  
  // 发送消息
  ws.send(msg);
}
// 行情数据end

// 获取首页数据
const getHomeData = async () => {
  try {
    const res = await HomeApi();
    if (res.success === 200) {
      userStore.setUserInfo(res.data.balance, 'balance');
      // 设置货币列表
      currencyList.value = res.data.currencyList;
      // 获取第二个货币项
      const item = res.data.currencyList[1];
      // 更新下单表单
      placeOrderForm.value = {
        ...placeOrderForm.value,
        amount: res.data.money || 50,
        type: item.name,
        expirationTime: item.times[0]
      };
      // 设置类型
      typeActive.value = JSON.parse(JSON.stringify(item));
      // 设置时间列表
      timesList.value = JSON.parse(JSON.stringify(item.times));
      // 设置利率
      interestRate.value = item.interest_rate;
      !ws && createWebSocket()
      !wsClientRef.value && userStore.userInfo.token && messageWebSocket()
    }
  } catch (error) {
    console.error('获取首页数据失败:', error);
  }
};
// 调用
userStore.token && getHomeData()
!ws && createWebSocket()

// 各种弹窗-------------
// 货币选择弹窗
function typeClick() {
  if (isLogin()) {
    isModalVisible.value = true
  }
}
const isModalVisible = ref(false);
const chengeType = (v) => {
  typeActive.value = JSON.parse(JSON.stringify(v));
};
const handleChange = () => {
  console.log(`用户选择货币切换: ${placeOrderForm.value.type} -> ${typeActive.value.name}`);
  
  isShow.value = true
  placeOrderForm.value.type = typeActive.value.name
  // 更新利率
  interestRate.value = typeActive.value.interest_rate;
  isModalVisible.value = false;
  
  console.log(`货币切换完成，新类型: ${placeOrderForm.value.type}, 新利率: ${interestRate.value}`);
};
// 时间切换和弹窗
const decreaseTime = () => {
  if (!isLogin()) {
    return false
  }
  let i = timesList.value.indexOf(placeOrderForm.value.expirationTime) //获取当前下标
  let time = timesList.value[i - 1] || timesList.value[timesList.value.length - 1]
  placeOrderForm.value = {
    ...placeOrderForm.value,
    expirationTime: time
  };
  if (lineChart.value) {
    lineChart.value.changeLastGap(time * 2)
  }
};
const increaseTime = () => {
  if (!isLogin()) {
    return false
  }
  const i = timesList.value.indexOf(placeOrderForm.value.expirationTime)
  const time = timesList.value[i + 1] || timesList.value[0]
  placeOrderForm.value = {
    ...placeOrderForm.value,
    expirationTime: time
  }
  // 调用图表方法
  if (lineChart.value) {
    lineChart.value.changeLastGap(time * 2)
  }
}
const isVisibleTime = ref(false);
// 选择时间
const selectTime = (time) => {
  placeOrderForm.value.expirationTime = time
  // 调用图表方法
  if (lineChart.value && lineChart.value.changeLastGap) {
    lineChart.value.changeLastGap(time * 2);
  }
  isVisibleTime.value = false
};

// 选择金额
const moneyList = [1, 5, 10, 20, 50, 100];
function jianAmount() {
  let val = placeOrderForm.value.amount
  let num = 1
  if (val > 5 && val <= 50) {
    num = 5
  } else if (val > 50 && val <= 100) {
    num = 10
  } else if (val > 100 && val <= 500) {
    num = 50
  } else if (val > 500) {
    num = 100
  }
  if (val > 1) {
    val -= num
  } else {
    val = 1
  }
  placeOrderForm.value.amount = val
}
function jiaAmount() {
  let val = placeOrderForm.value.amount
  let num = 1
  if (val >= 5 && val < 50) {
    num = 5
  } else if (val >= 50 && val < 100) {
    num = 10
  } else if (val >= 100 && val < 500) {
    num = 50
  } else if (val >= 500) {
    num = 100
  }
  val += num
  placeOrderForm.value.amount = val
}

// 登录按钮
const loginShow = ref(false);
const loginType = ref(0);
const openLogin = (type) => {
  loginShow.value = true;
  loginType.value = type;
};
const closeLogin = (val) => {
  switch (val) {
    case 0:
      location.reload();
      break;
    case 1:
      loginShow.value = false;
      openLogin(0);
      break;
    default:
      loginShow.value = false;
      break;
  }
};
const gotoCZ = () => {
  if (userStore.userInfo.is_analog == 1) {
    // message.warning({
    //   content:'游客用户不可操作',
    //   onClose:()=>{
    //     openLogin(0)
    //   }
    // })
    // openLogin(1)
    showConfirmDialog({
      title: '游客提示',
      className: "showConfirmDialog-bai",
      confirmButtonText: "去注册",
      message:
        '游客用户暂不可操作，是否退出游客模式并前往注册真实账户',
    })
      .then(() => {
        // on confirm
        userStore.clearUser();
        setTimeout(() => {
          openLogin(1)
        }, 500)
      })
      .catch(() => {
        // on cancel
      });
    return false
  }
  router.push("/Deposit");
};
// 倒计时组件
const countdownRef = ref(null)

const start = () => {
  countdownRef.value?.start()
}

const pause = () => {
  countdownRef.value?.pause()
}

const reset = () => {
  countdownRef.value?.reset()
}

const onFinish = () => {
  console.log('倒计时结束')
}
// 下单
const throttledEvent = throttle(placeOrderFun, 2000);
function placeOrderFun(buyType) { //买入
  if (!isLogin()) {
    return false
  }
  message.loading({
    content: "Loading...",
    duration: 0
  });
  // console.log(555);
  let from = {
    amountType: placeOrderForm.value.amountType,
    amount: placeOrderForm.value.amount,
    type: placeOrderForm.value.type,
    buyType: buyType,
    expirationTime: placeOrderForm.value.expirationTime,
    strikeTime: new Date().getTime(),
    buyAmount: placeOrderForm.value.buyAmount //当前价格
  }
  if (from.amount >= userStore.userInfo.balance) {
    message.info('余额不足');
    return
  }
  placeOrder(from).then(res => {
    if (res.success == 200) {
      message.destroy()
      message.success('买入成功');
      userStore.setUserInfo(res.data.balance, 'balance');
      
      // 获取下单时的实际价格数据
      const currentRealTimePrice = realTimeData.value.length > 0 ? 
        realTimeData.value[realTimeData.value.length - 1].y : from.buyAmount;
      const currentTimestamp = realTimeData.value.length > 0 ? 
        realTimeData.value[realTimeData.value.length - 1].label : from.strikeTime;
      
      // console.log('下单成功，准备添加标记点:', {
      //   订单ID: res.data.order.id,
      //   下单类型: buyType === 1 ? '买涨' : '买跌',
      //   下单时间: new Date(from.strikeTime).toLocaleTimeString(),
      //   实时价格: currentRealTimePrice,
      //   实时时间: new Date(currentTimestamp).toLocaleTimeString(),
      //   价格数据长度: realTimeData.value.length
      // });
      
      // 立即添加标记点，使用最新的实时数据
      console.log('res',res);
      const markerData = {
        id: res.data.order.id,
        timestamp: res.data.strikeTime, // 使用实时数据的时间戳
        price: res.data.order.open_price, // 使用实时数据的价格
        type: res.data.order.buy_type === 1 ? 'buy' : 'sell',
        color: res.data.order.buy_type === 1 ? 0x00ff00 : 0xff0000, // 绿色买涨，红色买跌
        size: 4, // 调整为小点，4像素大小
        label: res.data.order.buy_type === 1 ? 'Buy Up' : 'Buy Down',
        amount: res.data.order.amount
      };
      
      // 添加到标记点数组
      markerPoints.value.push(markerData);
      
      // 如果有PriceChart组件，立即添加标记点
      if (priceChartRef.value) {
        const markerId = priceChartRef.value.addMarker(markerData);
        console.log('标记点已添加到图表，ID:', markerId);
      } else {
        console.warn('PriceChart组件不可用，标记点将在组件可用时添加');
      }
      
      // setTimeout(() => {
      addBuySell(res.data, from.expirationTime)
      // }, 500);
    }
  })
}
// 添加买卖点
const buySells = ref([])
function addBuySell(item, expirationTime) {
  console.log(item);

  if (item.buyType == 1) { // 涨
    item.markPoint = lineChart.value.addElementHandler(item.strikeTime, item.order.amount, undefined, item.buyAmount)
  } else {
    item.markPoint = lineChart.value.addElementHandler(item.strikeTime, item.order.amount, 'red', item.buyAmount)
  }
  // 向下取整
  let t = Math.floor((newTs - item.strikeTime - 500) / 1000)
  t = t < 0 ? 0 : t
  // let t = ((newTs - item.strikeTime - 500) / 1000).toFixed(0)
  buySells.value.push({
    ...item,
    expirationTime: expirationTime - t,
    expirationTimeAll: expirationTime,
    isDel: true
  })
  buySells.value.sort((a, b) => a.expirationTime - b.expirationTime);
}
// 删除买卖点
function deleteBuySell(id) {
  for (let i = 0; i < buySells.value.length; i++) {
    let v = buySells.value[i]
    if (v.order.id == id) {
      v.markPoint && lineChart.value.destroyElementHandler(v.markPoint.id)
      buySells.value.splice(i, 1);
      
      // 同时移除对应的标记点
      const markerIndex = markerPoints.value.findIndex(marker => marker.id === id);
      if (markerIndex !== -1) {
        console.log(`从markerPoints中移除标记点: ${id}`);
        markerPoints.value.splice(markerIndex, 1);
        
        // 如果有PriceChart组件，移除标记点
        if (priceChartRef.value) {
          priceChartRef.value.removeMarker(id);
        }
      } else {
        console.log(`未找到要移除的标记点: ${id}`);
      }
      
      break;
    }
  }
}
let strikeTimeIndex = null
watch(
  () => buySells.value.length,
  (len) => {
    if (buySells.value.length) {
      let index = 0;
      let isIndex = true;
      buySells.value.forEach((buySell, i) => {
        if (buySell.expirationTime > 0 && isIndex) {
          index = i;
          isIndex = false;
        }
        if (!buySell.timer) {
          const initialExpirationTime = buySell.expirationTime;
          const startTime = Date.now();
          buySell.timer = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const remainingTime = initialExpirationTime - elapsedTime;
            if (remainingTime > 0) {
              buySell.expirationTime = remainingTime;
            } else {
              clearInterval(buySell.timer);
              buySell.expirationTime = "结算中";
              if (buySell.isDel) {
                deleteBuySell(buySell.order.id);
              }
            }
          }, 1000);
        }
      });
      currentExpiration.value = buySells.value[index].expirationTime * 1
      currentExpirationAll.value = buySells.value[index].expirationTimeAll * 1
      console.log(currentExpiration.value,currentExpirationAll.value);
      if (strikeTimeIndex != buySells.value[index].strikeTime) {
        start()
      }
    } else {
      // console.log(5555);
      currentExpirationAll.value=0
      currentExpiration.value =0
      reset()
      // pause()
      isModalVisibleOrder.value = false; //待结算订单弹窗
    }
  },
  { immediate: true }
);
// 定义 ref 来存储最新的状态
const amountTypeRef = ref(placeOrderForm.value.amountType);
const wsClientRef = ref(null);
const broadcast = ref({})
let broadcastTimer = null
let isReconnect = true
// 通知/数据WebSocketClient
function messageWebSocket() {
  isReconnect = true
  // 创建 WebSocketClient 实例
  wsClientRef.value = new WebSocketClient(`wss://rbgapi.cg777yakuza.com/ws?token=${userStore.userInfo.token}`, false, 30000);

  // 添加事件监听器
  wsClientRef.value.on('open', () => {
    console.log('已连接到 WebSocket  通知 服务器。')
    sendPing()
    // 发送消息
    if (broadcastTimer) {
      clearInterval(broadcastTimer)
    }
    broadcastTimer = setInterval(() => {
      sendPing()
    }, 5000)
    function sendPing() {
      if (wsClientRef.value.websocket && wsClientRef.value.websocket.readyState == 1) {
        let ping = {
          action: 'ping',
          amountType: amountTypeRef.value
        }
        // console.log(placeOrderForm.amountType);
        wsClientRef.value.send(JSON.stringify(ping));
      }
    }
  });
  wsClientRef.value.on('message', (data) => {
    let res = JSON.parse(data)
    if (res && res.action == 'orderNotice') {
      userStore.setUserInfo(res.balance, 'balance');
      orderData.value = res.order
      if (res.order.amount_net > 0) {
        // console.log('赢');
        winShow.value = true
      } else if (res.order.amount_net < 0) {
        lostShow.value = true
        // console.log('输');
      } else {
        // console.log('平');
        drawShow.value = true
      }
      // 取消线
      deleteBuySell(res.order.id)
    } else if (res && res.action == 'broadcast') {
      // res.data.broadcast.time = getCurrentTime()
      broadcast.value = res.data.broadcast
      // setOrderNum(res.orderNum)
    } else if (res && res.action == 'loginExpired' || res.action == 'otherToken' || res.action == 'notoken') {
      // location.reload();// 重新登录
      isReconnect = false
      // console.log("这里重新登录");
      message.warn('登录过期，请重新登录')
      userStore.clearUser();
      router.push("/");
      openLogin(0)

    } else if (res && res.action == 'ordersNotice') {//提前结算
      ycArr.push({
        ...res,
        end_price: Number(res.order.end_price),
        strikeTime: res.order.handled_timestamp - 500
      })
      for (let index = 0; index < buySells.value.length; index++) {
        const element = buySells.value[index];
        if (element.order.id == res.order.id) {
          element.isDel = false
          break;
        }
      }
      // console.log(new Date(res.order.created_at).getTime(),'////');
    }
  });
  wsClientRef.value.on('close', (event) => {
    if (isReconnect) {
      isCloseWebSocket && messageWebSocket()
    }
    console.log('WebSocket 已关闭:', event.reason)
  });
  wsClientRef.value.on('error', (error) => {
    console.error('WebSocket 错误:', error)
    // wsClientRef.value.disconnect()
  });
  // 连接到 WebSocket 服务器
  wsClientRef.value.connect();
}
watch(
  () => placeOrderForm.value.amountType,
  (newVal) => {
    amountTypeRef.value = placeOrderForm.value.amountType;
  }
);
// 时间格式化函数：返回 [时, 分, 秒]
function formatSeconds(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return [m, s];
}
function isLogin() {
  if (userStore.token) {
    return true
  } else {
    message.warn(t('hint.h26'))
    return false
  }
}
// 赢
const winShow = ref(false)
const lostShow = ref(false)
const drawShow = ref(false)
const orderData = ref({})
let vapDom = ref(null)
let vap = null
watch(
  () => winShow.value,
  (newVal) => {
    if (winShow.value) {
      setTimeout(() => {
        // console.log(vapDom.value);
        vap = new Vap({
          container: vapDom.value,
          src: video,
          config: vapc,
          width: 318,
          height: 162,
          loop: true, // 首次不循环，完整播放
        })
        // vap.on('ended', () => {
        //   console.log(vap);

        //   // 首次播放结束后，改为循环后半部分
        //   vap.setOptions({
        //     container: vapDom.value,
        //     src: video,
        //     config: vapc,
        //     width: 318,
        //     height: 162,
        //     loop: true, // 首次不循环，完整播放
        //     beginPoint: 1.9, // 从第2秒开始（示例，按需调整）
        //   });
        //   vap.play(); // 重新播放
        // });
      }, 10)
    } else {
      vap && vap.destroy()
    }
  }
);
// 数字键盘
const popupShow = ref(false)

const checkmarkemptyChange = (e) => {
  if (e == -1) {
    placeOrderForm.value.amount = Number(String(placeOrderForm.value.amount).slice(0, -1))
    // if (placeOrderForm.value.amount < 1) {
    // 	placeOrderForm.value.amount = 1
    // }
  } else {
    placeOrderForm.value.amount = Number(placeOrderForm.value.amount + String(e))
  }
  // console.log('选中值:', val)
}

const popupCloseNumericKeypad = () => {
  if (placeOrderForm.value.amount <= 1) {
    placeOrderForm.value.amount = 1
  }
  popupShow.value = false
}

// 创建 ResizeObserver 实例
let resizeObserver = null
const parentRef = ref(null)
const parentHeight = ref(0)
onActivated(() => {
  if (route.query.openLogin == 1 && !userStore.token) {
    openLogin(1)
  }
})

onMounted(() => {
  // 初始化父容器高度
  updateParentHeight()

  // 使用 ResizeObserver 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    updateParentHeight()
  })

  if (parentRef.value) {
    resizeObserver.observe(parentRef.value)
  }
})

onBeforeUnmount(() => {
  buySells.value.forEach(buySell => clearInterval(buySell.timer));
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (broadcastTimer) {
    clearInterval(broadcastTimer); // 清理计时器
    broadcastTimer = null
  }
  // 清理图表数据缓冲区
  clearChartDataBuffer();
})

// 更新父容器高度
const updateParentHeight = () => {
  if (parentRef.value) {
    parentHeight.value = parentRef.value.clientHeight
    // console.log(parentRef.value.clientHeight);
  }
}

// 添加数据到图表缓冲区
function addDataToChartBuffer(dataPoint) {
  // 验证数据源是否匹配当前选择的类型
  if (dataPoint.source && dataPoint.source !== typeRef.value) {
    console.log(`数据源不匹配，忽略数据: ${dataPoint.source} vs ${typeRef.value}`);
    return;
  }
  
  chartDataBuffer.value.push(dataPoint);
  
  // 添加调试信息
  // console.log(`添加${dataPoint.source || 'unknown'}数据到图表缓冲区:`, {
  //   timestamp: dataPoint.timestamp,
  //   price: dataPoint.price,
  //   source: dataPoint.source
  // });
  // console.log('当前缓冲区大小:', chartDataBuffer.value.length);
  
  // 每隔500ms批量更新图表数据
  if (!window.chartUpdateTimer) {
    window.chartUpdateTimer = setInterval(() => {
      if (chartDataBuffer.value.length > 0) {
        // console.log(`批量更新图表数据，数量: ${chartDataBuffer.value.length}, 数据源: ${typeRef.value}`);
        // 将缓冲区数据复制到图表数据中
        chartRealTimeData.value = [...chartDataBuffer.value];
        // 清空缓冲区
        chartDataBuffer.value = [];
      }
    }, 500);
  }
}

// 清理图表数据缓冲区
function clearChartDataBuffer() {
  console.log(`清理图表数据缓冲区，当前数据源: ${typeRef.value}`);
  chartDataBuffer.value = [];
  chartRealTimeData.value = [];
  isFirstRender.value = true; // 重置第一次渲染标志位
  if (window.chartUpdateTimer) {
    clearInterval(window.chartUpdateTimer);
    window.chartUpdateTimer = null;
    console.log('清理图表更新定时器');
  }
}

// 处理标记点被移除的事件
const handleMarkersRemoved = (removedMarkerIds) => {
  console.log('接收到标记点移除事件:', removedMarkerIds);
  // 从markerPoints数组中移除对应的标记点
  markerPoints.value = markerPoints.value.filter(marker => !removedMarkerIds.includes(marker.id));
  console.log(`已从markerPoints中移除 ${removedMarkerIds.length} 个标记点，剩余 ${markerPoints.value.length} 个`);
};
</script>
<style lang="scss" scoped>
.page-box {
  width: 100%;
  height: calc(100vh - 64px);

  .ant-btn {
    border: none;
    color: $textColor;

    &:hover {
      color: $textColor;
      opacity: 0.8;
    }
  }

  .btn1 {
    background: linear-gradient(180deg, #04e3ff 0%, #3b67ff 100%);
  }

  .btn2 {
    background: #327ee1;
  }

  .btn3 {
    background: #f4cc00;
    color: #000;
  }

  display: flex;
  flex-direction: column;

  .top-box {
    .navbar-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 48px;
      background: #001223;
      padding: 0 10px;

      .left {
        .left-con {
          display: flex;
          padding: 4px 4px 4px 2px;
          align-items: center;
          gap: 4px;
          border-radius: 5px;
          background: rgba(145, 142, 255, 0.15);

          img {
            width: 24px;
          }

          .aumont {
            color: #FFDE2E;
            text-align: center;
            font-family: Inter;
            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
            text-transform: capitalize;
          }

          .icon {
            color: #8D99A7;
            font-size: 14px;
          }
        }

      }

      .right {
        .btnBox {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .balance {
          div {
            display: flex;
            align-items: center;
            background: #1a2c38;
            font-size: 14px;
            padding: 4px;
            border-radius: 6px;
            cursor: pointer;
          }

          p {
            margin: 0 6px 0 0;
          }
        }
      }
    }

    .top-eontent {
      height: 105px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000A23;

      .left,
      .right {
        max-height: 100%;
        min-height: 81px;
        width: calc(50% - 60px - 10px);
        margin-left: 10px;
        border-radius: 5px;
        border: 1px dashed rgba(255, 255, 255, 0.50);
        background: #09112E;
        padding: 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-image: url('@/assets/images/databg.png');
        background-size: 100% 100%;
        background-repeat: no-repeat;

        .line {
          color: #B4CBE7;
          font-size: 12px;
          font-weight: 400;

          span {
            color: #FFF;
            font-size: 14px;
            font-weight: 600;
          }

          .pre {
            color: #00FF47;
            font-size: 14px;
            font-weight: 600;
          }
        }
      }

      .right {
        margin-left: 0px;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0;
        padding-top: 10px;


        .con {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;

          .zhong {
            color: #FFF;
            font-size: 16px;
            font-weight: 700;
          }

          .jian {
            width: 25px;
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 5px 0;

            img {
              width: 100%;
            }
          }

        }

        .name {
          color: #B4CBE7;
          text-align: center;
          font-size: 10px;
          font-weight: 400;
        }
      }

      // .left,
      // .right {
      //   flex: 1;
      //   text-align: center;
      //   color: #10C800;


      //   .name {
      //     font-family: Inter;
      //     font-size: 12px;
      //     font-style: normal;
      //     font-weight: 400;
      //     line-height: normal;
      //     text-transform: capitalize;
      //     margin-bottom: 10px;
      //   }

      //   .val {
      //     font-family: "Future Earth";
      //     font-size: 16px;
      //     font-style: normal;
      //     font-weight: 400;
      //     line-height: normal;
      //     text-transform: capitalize;
      //   }
      // }

      // .right {
      //   color: #FF5959;
      // }

      .center {
        width: 120px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .CircularCountdown-con {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: url('@/assets/images/vector.png') no-repeat center center;
          background-size: cover;
          position: relative;
          padding-bottom: 16px;

          .times {
            color: #3FF100;
            font-family: "Future Earth";
            font-size: 38px;
            font-weight: 400;

            &.animation {
              animation: bounce-in .99s ease infinite;
            }
          }

          .times2 {
            color: #3FF100;
            font-family: "Future Earth";
            font-size: 30px;
            font-weight: 400;
          }

          .esc {
            font-family: "Future Earth";
            color: #FFF;
            font-size: 12px;
            font-weight: 400;
            position: absolute;
            bottom: 12px;
          }

          .addsec {
            position: absolute;
            width: 28px;
            right: -5px;
            top: 0;
            cursor: pointer;
          }
        }
      }
    }
  }

  .center-box {
    flex: 1;
    position: relative;

    .loading {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      z-index: 99;
      margin: auto;
      background-color: #030616;
    }

    .top {
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      margin-top: 8px;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;

      .left {
        display: flex;
        align-items: center;
        border-radius: 5px;
        background: rgba(0, 65, 163, 0.50);
        padding: 4px;
        gap: 6px;
        color: #FFF;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;

        img {
          width: 18px;
        }
      }

      .right {
        display: flex;
        gap: 8px;

        .item {
          width: 26px;
          height: 26px;
          cursor: pointer;

          img {
            width: 100%;
          }
        }
      }
    }

    .chart {
      height: 100%;
      // background-color: #081626;
      // background: linear-gradient(180deg, #081228 0%, rgba(0, 69, 19, 0.50) 100%);
      // background-image: url('/assets/images/chartbg2.png');
      // background-repeat: no-repeat;
      // background-size: 100% 100%;
      // background: linear-gradient(180deg, rgba(0, 69, 19, 0.50) 0%, rgba(94, 0, 0, 0.50) 100%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .bottom-box {
    height: 220px;
    background: #000A23;
    padding: 5px 10px 10px;

    .buy-box {
      display: flex;
      justify-content: space-between;
      height: 68px;
      gap: 12px;
      margin-bottom: 12px;

      .up,
      .down {
        width: calc(50% - 6px);
        border-radius: 5px;
        padding: 0 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .msg {
          color: #10C800;
          font-size: 20px;
          font-weight: 700;
          text-transform: capitalize;
          padding-left: 10px;
          margin-bottom: 1px;
        }

        .name {
          color: #10C800;
          font-size: 14px;
          font-weight: 700;
        }
      }

      .up {
        background-image: url('@/assets/images/up.png');
        background-repeat: no-repeat;
        background-size: 100%;
      }

      .down {
        background-image: url('@/assets/images/down.png');
        background-repeat: no-repeat;
        background-size: 100%;

        .msg {
          color: #FF5959;
          padding-left: 20px;
        }

        .name {
          color: #FF5959;
        }
      }
    }

    .money-box {
      display: flex;
      justify-content: space-between;
      height: 34px;
      line-height: 34px;
      margin-bottom: 12px;

      .item {
        height: 100%;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.20);
        background: #0D1D58;
        padding: 0 12px;
        color: rgba(255, 255, 255, 0.50);
        // leading-trim: both;
        // text-edge: cap;
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        cursor: pointer;

        span {
          font-size: 12px;
          font-weight: 600;
        }

        &.active {
          border-radius: 5px;
          border: 1px solid #52FF00;
          background: radial-gradient(50% 50% at 50% 50%, #004F25 0%, #000410 100%);
        }
      }
    }

    .data-box {
      display: flex;
      justify-content: space-between;
      height: 79px;

      .left,
      .right {
        width: calc(50% - 6px);
        height: 100%;
      }

      .left {
        border-radius: 5px;
        border: 1px dashed rgba(255, 255, 255, 0.50);
        background: #09112E;
        padding: 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-image: url('/assets/images/Linebg.png');
        background-size: 100%;
        background-repeat: no-repeat;

        .line {
          color: #B4CBE7;
          font-size: 12px;
          font-weight: 400;

          span {
            color: #FFF;
            font-size: 14px;
            font-weight: 600;
          }

          .pre {
            color: #00FF47;
            font-size: 14px;
            font-weight: 600;
          }
        }
      }

      .right {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .line {
          width: 100%;
          height: 36px;
          border-radius: 5px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: #0D1D58;
          display: flex;
          align-items: center;
          overflow: hidden;
          justify-content: space-between;

          .jian {
            width: 36px;
            height: 36px;
            cursor: pointer;

            img {
              width: 100%;
            }
          }

          .mo {
            height: 100%;
            flex: 1;

            .val {
              color: #FFF;
              font-size: 12px;
              font-weight: 700;
              text-align: center;
            }

            .msg {
              color: #B4CBE7;
              text-align: center;
              font-size: 10px;
              font-weight: 400;
            }

            &.active {
              background: #1c348d;
            }
          }
        }
      }
    }
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(.3);
  }

  50% {
    opacity: 1;
    transform: scale(1.45);
  }

  70% {
    transform: scale(.9);
  }

  100% {
    transform: scale(1);
  }
}



// 货币选择弹窗
.typePoup-custom-class2 {
  border-radius: 8px;
  background: #0D172F;
  overflow: hidden;
  width: 85vw;
  max-width: 390px;
  padding: 16px 20px;

  .title-txt {
    color: #FFF;
    text-align: center;
    font-size: 18px;
    font-weight: 400;
  }

  .content-typePoup {
    max-height: 300px;
    overflow-y: auto;

    .line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 50px;
      color: #FFF;
      font-size: 14px;
      font-weight: 600;

      .rg {
        display: flex;
        align-items: center;

        .radioName {
          margin-left: 10px;
        }
      }
    }
  }

  .btn {
    border-radius: 8px;
    background: #10C800;
    border: 1px solid #10C800;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    color: #000;
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    cursor: pointer;
  }
}

// 交易时间弹窗
.time-popup {
  padding: 15px;
  max-height: 60vh;
  overflow-y: auto;

  .title {
    text-align: center;
    padding: 16px 0;
    color: #FFF;
    font-size: 18px;
    font-weight: 400;
    position: relative;

    img {
      width: 24px;
      position: absolute;
      right: 0;
      top: 10px;
    }
  }

  .item:nth-child(2n -1) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 61px;
    border-radius: 5px;
    background: #040C1F;
    margin-bottom: 10px;

    .lf {
      color: #FFF;
      font-size: 16px;
      font-weight: 400;
      margin-right: 10px;
    }

    .center {
      height: 100%;
      width: 130px;
      background-image: url('@/assets/images/d.png');
      background-size: 86px;
      background-repeat: no-repeat;
      background-position: right center;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 20px;
      color: #52FF00;
      font-family: "Future Earth";
      font-size: 20px;
      font-weight: 400;
    }

    .btn {
      border-radius: 5px;
      background: #52FF00;
      color: #000;
      font-size: 14px;
      font-weight: 600;
      margin-left: 10px;
      height: 29px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }

  .item:nth-child(2n) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 61px;
    border-radius: 5px;
    background: #040C1F;
    margin-bottom: 10px;

    .lf {
      color: #FFF;
      font-size: 16px;
      font-weight: 400;
      margin-right: 10px;
    }

    .center {
      height: 100%;
      width: 130px;
      background-image: url('@/assets/images/s.png');
      background-size: 86px;
      background-repeat: no-repeat;
      background-position: right center;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 20px;
      color: #FF5959;
      font-family: "Future Earth";
      font-size: 20px;
      font-weight: 400;
    }

    .btn {
      border-radius: 5px;
      background: #FF5959;
      color: #000;
      font-size: 14px;
      font-weight: 600;
      margin-left: 10px;
      height: 29px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
}

// 进行中订单
.typePoup-custom-class {
  width: 100vw;
  border-radius: 12px;
  padding: 12px;
  background: #000a23 !important;
  backdrop-filter: blur(5px);

  .popup-header {
    color: #FFF;
    font-family: Inter;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16px;
  }

  .content-typePoup {
    width: 100%;
    overflow-y: auto;
    max-height: 70vh;

    .line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
      border-radius: 5px;
      background: #152237;
      padding: 0 12px;
      background-image: url('@/assets/images/d.png');
      background-repeat: no-repeat;
      background-size: 86px;
      background-position: center right;
      height: 72px;
      padding-right: 40px;

      .item {
        flex: 1;

        .na {
          color: #8D99A7;
          font-size: 10px;
          font-weight: 400;
          text-align: center;
          margin-bottom: 5px;
        }

        .naup {
          color: #10C800;
        }

        .val {
          color: rgba(255, 255, 255, 0.60);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          text-align: center;
          height: 25px;
        }

        .valsy {
          color: #52FF00;
        }

        .valje {
          color: #B4CBE7;
        }

        .val-time {
          display: flex;
          align-items: center;
          gap: 2px;

          .ts {
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(180deg, #001C55 0%, #004837 100%);
            border-radius: 2px;
            border: 1px solid rgba(255, 255, 255, 0.30);
            color: #FFF;
            text-align: center;
            font-family: "Future Earth";
            font-size: 17px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            padding: 0px 2px 3px;
            min-width: 18px;
          }
        }
      }

      &:nth-child(2n) {
        background-image: url('@/assets/images/s.png');

        .item {
          .naup {
            color: #FF5959;
          }
        }
      }
    }


  }
}

// 赢弹窗
.title-dialog1 {
  color: #FFF;
  font-family: "Future Earth";
  font-size: 30px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.amout-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  height: 60px;
  background: rgba(0, 18, 36, 0.40);
  color: rgba(255, 255, 255, 0.50);
  font-size: 14px;
  font-weight: 400;

  .amount {
    color: #52FF00;
    font-size: 30px;
    font-weight: 700;
  }
}

.className-dialog {
  .con-tc {
    background: #000A23;
    height: 162px;
    // 添加动画
    // animation: rotate 3s infinite linear;
    position: relative;

    .img1 {
      width: 234px;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;
      // 添加动画
      // animation: rotate 3s infinite linear;
    }

    .img2 {
      width: 146px;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;
    }
  }

  .price-box {
    height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 15px;
    gap: 5px;

    .line {
      display: flex;
      justify-content: space-between;
      color: rgba(255, 255, 255, 0.50);
      font-size: 14px;
      font-weight: 400;

      .val {
        color: #52FF00;
        font-size: 14px;
        font-weight: 700;
      }

      .val2 {
        color: #FF5959;
        font-size: 14px;
        font-weight: 700;
      }
    }
  }

  // 旋转动画持续
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .con2-tc {
    padding: 10px;
    text-align: center;

    .name {
      color: #FFF;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 9px;
    }

    .amount {
      color: #52FF00;
      font-size: 40px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }

}

.title-dialog1,
.title-dialog2,
.title-dialog3 {
  position: relative;

  .closeImg {
    width: 24px;
    position: absolute;
    right: 15px;
    top: -10px;
  }
}

// 输弹窗
.title-dialog2 {
  color: #FF5959;
  font-family: "Future Earth";
  font-size: 30px;
  font-weight: 400;
  margin-bottom: 20px;
}

.className-dialog2 {


  .con-tc {
    background: #000A23;
    // height: 162px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    img {
      height: 162px;
      margin: auto;
    }

    .txt-tc {
      display: flex;
      justify-content: space-around;
      text-align: center;
      padding-bottom: 10px;

      .name {
        color: rgba(255, 255, 255, 0.50);
        font-size: 16px;
        font-weight: 400;
      }

      .val {
        color: #FFF;
        font-size: 16px;
        font-weight: 400;
      }

      .left {
        .val {
          color: #52FF00;
          font-size: 16px;
          font-weight: 400;
        }

        .val2 {
          color: #FF5959;
          font-size: 16px;
          font-weight: 400;
        }
      }
    }
  }

  .price-box {
    height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 15px;
    gap: 5px;

    .line {
      display: flex;
      justify-content: space-between;
      color: rgba(255, 255, 255, 0.50);
      font-size: 14px;
      font-weight: 400;

      .val {
        color: #52FF00;
        font-size: 14px;
        font-weight: 700;
      }

      .val2 {
        color: #FF5959;
        font-size: 14px;
        font-weight: 700;
      }
    }
  }

  .con2-tc {
    padding: 10px;

    text-align: center;
    color: #FFF;
    font-family: "Future Earth";
    font-size: 16px;
    font-weight: 400;
  }
}

// ping
.title-dialog3 {
  color: #808080;
  font-family: "Future Earth";
  font-size: 30px;
  font-weight: 400;
  margin-bottom: 20px;
}

.className-dialog3 {


  .con-tc {
    background: #000A23;
    // height: 162px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      margin: auto;
    }
  }

  .con2-tc {
    padding: 10px;
    text-align: center;
    color: #FFF;
    font-family: "Future Earth";
    font-size: 16px;
    font-weight: 400;
  }
}
</style>