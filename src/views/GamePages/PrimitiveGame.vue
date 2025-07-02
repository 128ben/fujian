<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/useUserStore";
import {
  startGameApi,
  betOrderApi,
  lastOrderInfoApi,
  // userBalanceApi,
} from "@/utils/api";
import { useWebSocket } from "@/components/useWebSocket";
import confetti from "canvas-confetti";
import PopUps from "@/components/PopUps.vue";
import WebVideo from "./WebRTCPlayer.vue";
import HistoryPop from "./components/history.vue";
import GameList from "@/components/GameList.vue";
import OpenVal from "./components/openVal.vue";
import LottieAnimation from './components/LottieAnimation.vue'
import LottieAnimationUrl from "@/assets/lottie/data.json"
import ranking1 from "@/assets/svg/ranking1.svg";
import ranking2 from "@/assets/svg/ranking2.svg";
import ranking3 from "@/assets/svg/ranking3.svg";
import Marbles1 from "@/assets/img/Marbles1.png";
import Marbles2 from "@/assets/img/Marbles2.png";
import Marbles2s from "@/assets/img/Marbles2s.png";
import Marbles3 from "@/assets/img/Marbles3.png";
import Marbles4 from "@/assets/img/Marbles4.png";
import Marbles5 from "@/assets/img/Marbles5.png";
import Marbles6 from "@/assets/img/Marbles6.png";
import Marbles7 from "@/assets/img/Marbles7.png";
import Marbles8 from "@/assets/img/Marbles8.png";
import Marbles9 from "@/assets/img/Marbles9.png";
import Marbles10 from "@/assets/img/Marbles10.png";
import chip0 from "@/assets/img/chip0.png";
import chip1 from "@/assets/img/chip1.png";
import chip5 from "@/assets/img/chip5.png";
import chip10 from "@/assets/img/chip10.png";
import chip20 from "@/assets/img/chip20.png";
import chip50 from "@/assets/img/chip50.png";
import chip100 from "@/assets/img/chip100.png";
import chip200 from "@/assets/img/chip200.png";
import chip500 from "@/assets/img/chip500.png";
import chip1000 from "@/assets/img/chip1000.png";
import chip2000 from "@/assets/img/chip2000.png";
import chip5000 from "@/assets/img/chip5000.png";
import chip10000 from "@/assets/img/chip10000.png";
import chip20000 from "@/assets/svg/chip20000.svg";
import chip50000 from "@/assets/svg/chip50000.svg";
import sound1 from "@/assets/Sound/click1.mp3";
import sound2 from "@/assets/Sound/click2.mp3";
import sound3 from "@/assets/Sound/click3.mp3";
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const gameId = route.params.id;
const gameCode = route.params.code;
const gameLive = ref("");
const gameRule = ref({});
const ruleList = ref([]);
const invalid = ref(true); // 上期状态
const code_name = ref("")
const lastPeriod = ref({
  expect: "",
  result: "",
  status: 0,
}); //上期下注内容
const resultArray = ref([]); // 上期下注数组
const nowPeriod = ref({}); // 单期下注内容
const spinning = ref<boolean>(false);
const network = ref<boolean>(false);
const userStore = useUserStore();
const countDownVal = ref(60000);
const screenHeight = ref(window.innerHeight);
const checkHeight = () => {
  // 更新屏幕高度
  screenHeight.value = window.innerHeight;
};
const chipMap = {
  5: chip5,
  10: chip10,
  20: chip20,
  50: chip50,
  100: chip100,
  200: chip200,
  500: chip500,
  1000: chip1000,
  2000: chip2000,
  5000: chip5000,
  10000: chip10000,
  20000: chip20000,
  50000: chip50000,
};
const MarblesMap = {
  1: Marbles1,
  2: gameCode != 'town' ? Marbles2s : Marbles2,
  3: Marbles3,
  4: Marbles4,
  5: Marbles5,
  6: Marbles6,
  7: Marbles7,
  8: Marbles8,
  9: Marbles9,
  10: Marbles10,
};
const isBalanceShow = ref(true);
const getUserBalance = async () => {
  isBalanceShow.value = false;
  try {
    const res = await userBalanceApi({});
    if (res.success) {
      userStore.setUserInfo(res.data.balance, "balance");
      isBalanceShow.value = true;
    }
  } catch (error) { }
};
const aboutTime = ref(10);
const bet_close = ref(20);
const gameTime = ref(0) //游戏预估总时间
const overTime = ref(0) //游戏封盘时间
if (gameCode == 'town') {
  gameTime.value = 30
} else if (gameCode == 'silver') {
  gameTime.value = 85
} else {
  gameTime.value = 50
}
const getData = async () => {
  spinning.value = true;
  try {
    const res = await startGameApi({ game_id: gameId });
    if (res.success) {
      gameLive.value = res.data.webrtc
      // 遍历对象并添加字段
      for (let key in res.data.gameRule) {
        for (let subKey in res.data.gameRule[key]) {
          res.data.gameRule[key][subKey].forEach((item) => {
            item.bet = 0;
          });
        }
      }
      gameRule.value = res.data.gameRule;
      overTime.value = res.data.nowPeriod.entertained_time;
      aboutTime.value = res.data.nowPeriod.advance_close;
      bet_close.value = res.data.nowPeriod.bet_close;
      code_name.value = res.data.code_name
      let startTime = Math.floor(Date.now() / 1000);
      upDataGameInfo(overTime.value, aboutTime.value, bet_close.value, startTime);

      // 修改自定义筹码数组
      chipVal.value = res.data.betAmount.map((amount) => ({
        val: amount,
        icon: chipMap[amount],
        isCheck: true,
      }));
      costomList.value = res.data.betAmount.map((amount) => ({
        val: amount,
        icon: chipMap[amount],
        isCheck: true,
      }));
      // 筹码初始值
      activeChipVal.value = chipVal.value[4].val;
      nowPeriod.value = res.data.nowPeriod;
      if (res.data.lastPeriod.status == -1) {
        invalid.value = false;
        lastPeriod.value = res.data.lastPeriod;
      } else {
        invalid.value = true;
        lastPeriod.value = res.data.lastPeriod;
        resultArray.value = res.data.lastPeriod.result.split(",").map(Number);
      }
      spinning.value = false;
      network.value = false;
    }
  } catch (error) {
    spinning.value = false;
    network.value = true;
    console.error("Error fetching data:", error);
  }
};
// 更新倒计时
const upDataGameInfo = (overTime, aboutTime, bet_close, startTime) => {
  countDownVal.value = (Number(overTime) - bet_close - startTime) * 1000;
};

//正常时间 即将封盘 已封盘
const aboutFunVal = ref(false);
const Entertained = ref(true);
const predictTime = ref(0)
const normalTimeFun = () => {
  Entertained.value = true;
  aboutFunVal.value = false;
  countLoading.value = true
};
const aboutFun = () => {
  Entertained.value = true;
  aboutFunVal.value = true;
};
const EntertainedFun = () => {
  aboutFunVal.value = false;
  Entertained.value = false;
  let startTime = Math.floor(Date.now() / 1000);
  if (startTime > overTime.value) {
    console.log('封盘进入');
    predictTime.value = ((gameTime.value + 20 + 15) - (startTime - overTime.value)) * 1000
    countLoading.value = true
  } else {
    console.log('未封盘进入');
    predictTime.value = (gameTime.value + 20 + 15) * 1000
    countLoading.value = true
  }
};
// websocket配置
let pingInterval;
const url = "wss://uapi.mgamestar.xyz/ws"; // 替换为你的 WebSocket URL
const token = userStore.token; // 替换为你的 token

// 使用 useWebSocket 函数
const { messages, isConnected, startWebSocket, sendMessage } = useWebSocket(
  url,
  token,
  (e) => {
    upDataMessage(e);
  }
);

// 定义连接方法
const getWebsocket = () => {
  startWebSocket();
  pingInterval = setInterval(getPing, 20000);
};
const getPing = () => {
  let obj = {
    action: "ping",
  };
  sendMessage(JSON.stringify(obj));
};
const upDataMessage = (e) => {
  let obj = JSON.parse(e)
  if (obj.msg) {
    if (obj.msg.slice(0, 8) == 'welecome') {
      sendMessageVal();
    }
  }

  if (!JSON.parse(e).code) {
    let res = JSON.parse(e);
    if (res.step == "open") {
      upDatavalNum(res); // 更新顶部号码排列
      getGameInfo(res.game_code, res.expect); // 更新金额
      resetVal();
      getData()
      countLoading.value = true
    } else if (res.step == "start") {
      upDataNowVal(res); //更新期号
      normalTimeFun(); // 更新正常时间
      let overTime = res.entertained_time;
      let aboutTime = res.advance_close;
      let bet_closes = res.bet_close;
      let startTime = Math.floor(Date.now() / 1000);
      upDataGameInfo(overTime, aboutTime, bet_closes, startTime);
    } else if (res.step == "win") {
      openWinningVal(res.win);
      getblc()
    } else if (res.step == "refund") {
      getblc()
    }
  }
};
const getblc = async () => {
  try {
    const res = await userBalanceApi({});
    if (res.success) {
      userStore.setUserInfo(res.data.balance, "balance");
    }
  } catch (error) { }
}
const sendMessageVal = () => {
  let obj = {
    action: "subscribe",
    game: gameCode,
  };
  sendMessage(JSON.stringify(obj));
};

//检测用户是否离开页面或返回页面
const isVisible = ref(true);
const handleVisibilityChange = () => {
  isVisible.value = !document.hidden; // document.hidden 为 true 表示页面不可见
  if (isVisible.value) {
    console.log('页面重新可见');
    setTimeout(() => {
      getData()
    }, 2000);
    // 这里可以添加用户返回时需要执行的逻辑
  } else {
    console.log('页面不可见');
    // 这里可以添加用户离开时需要执行的逻辑
  }
};

const gameWin = ref(false)
const gameWinVal = ref("")
// 提示本期中奖信息
const openWinningVal = async (val) => {
  //中奖弹窗
  if (val > 0) {
    gameWin.value = true
    confetti({
      particleCount: 150,
      spread: 60,
    });
    gameWinVal.value = val
    setTimeout(() => {
      closeFun()
    }, 7000);
  }
};
const closeFun = () => {
  gameWin.value = false
}

// 更新顶部号码排列
const upDatavalNum = (res) => {
  if (res.status == -1) {
    invalid.value = false;
    lastPeriod.value.expect = res.expect;
  } else {
    invalid.value = true;
    lastPeriod.value.expect = res.expect;

    resultArray.value = res.result.split(",").map(Number);
  }
};
const upDataNowVal = (res) => {
  nowPeriod.value.expect = res.expect;
};

onMounted(() => {
  getData();
  getWebsocket();
  window.addEventListener("resize", checkHeight);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  // 初始检查
  checkHeight();
});

// 游戏玩法
// 排名选择
const activeRank = ref(null);
const nowRankVal = ref(1);
const setActiveRank = (index) => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  playSound(sound1)
  activeRank.value = index;
  nowRankVal.value = index;
};

// 大小单双
const subEvenOddVal = ref([]);
const setActiveEvenOdd = (val, i) => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  playSound(sound2)
  if (isActiveRank()) {
    const index = subEvenOddVal.value.indexOf(val);
    if (index === -1) {
      subEvenOddVal.value.push(val);
    }
    gameRule.value[nowRankVal.value][2][i].bet += activeChipVal.value;
    formatBetVal();
    isBalance.value = amounts.value.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
  }
};

// 弹珠号码
const subEvenNumber = ref([]);
const setActiveNumber = (val, i) => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  playSound(sound3)
  if (isActiveRank()) {
    const index = subEvenNumber.value.indexOf(val);
    if (index === -1) {
      subEvenNumber.value.push(val);
    }
    gameRule.value[nowRankVal.value][1][i].bet += activeChipVal.value;
    formatBetVal();
    isBalance.value = amounts.value.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
  }
};

// 筹码
const chipVal = ref([]);
const activeChip = ref(4); //选中筹码下标
const activeChipVal = ref([]); // 选中筹码值
const setActiveChip = (index, val) => {
  activeChip.value = index;
  activeChipVal.value = val;
};

// 自定义筹码弹窗
const customShow = ref(false);
const openCustomShow = () => {
  // 同步原数组状态
  for (let i = costomList.value.length - 1; i >= 0; i--) {
    if (!chipVal.value[i].isCheck) {
      costomList.value[i].isCheck = false;
    } else {
      costomList.value[i].isCheck = true;
    }
  }
  customShow.value = true;
  // 如果存在自定义值，输入框的值就等于自定义值
  if (chipVal.value[0].icon.search("chip0") != -1) {
    chipInputVal.value = chipVal.value[0].val;
    customInput.value = true;
  }
};

const closeCustomPop = () => {
  customShow.value = false;
  if (chipVal.value[0].icon.search("chip0") != -1) {
  } else {
    chipInputVal.value = "";
    customInput.value = false;
  }
};

const chipInputVal = ref(""); //输入框值
// 确认添加自定义筹码值
const costomList = ref([]); // 自定义筹码数组
const addChipList = () => {
  if (chipInputVal.value == "") return false;
  if (chipVal.value[0].icon.search("chip0") != -1) {
    chipVal.value[0] = {
      val: chipInputVal.value,
      icon: chip0,
      isCheck: true,
    };
  } else {
    chipVal.value.unshift({
      val: chipInputVal.value,
      icon: chip0,
      isCheck: true,
    });
  }
};

// 自定义数组切换选中状态
const customInput = ref(false); //是否选择自定义筹码
const setChooseChip = (val, i) => {
  if (val == "custom") {
    customInput.value = !customInput.value;
  } else {
    costomList.value[i].isCheck = !costomList.value[i].isCheck;
  }
};

// 确认筹码
const submitChipVal = () => {
  // 如果选中自定义，判断输入框是否有值
  if (customInput.value) {
    if (chipInputVal.value == "") {
      message.error(t("game0.g2"));
      return false;
    }
    addChipList();
  } else {
    // 如果没有选中自定义，判断原数组第一项是否存在自定义值 有的话就删除
    if (chipVal.value[0].icon.search("chip0") != -1) {
      chipVal.value.splice(0, 1);
    }
    // 循环原数组和筛选数组对比 删除没选中的
    for (let i = chipVal.value.length - 1; i >= 0; i--) {
      if (!costomList.value[i].isCheck) {
        chipVal.value[i].isCheck = false;
      } else {
        chipVal.value[i].isCheck = true;
      }
    }
  }
  closeCustomPop();
};

// 重置
const resetVal = () => {
  activeRank.value = null; //名次
  nowRankVal.value = 1;
  isBalance.value = 0;
  amounts.value = [];
  betcodes.value = [];
  previewArr.value = [];
  resultPop.value = false;
  subEvenOddVal.value = [];
  subEvenNumber.value = [];
  for (let key in gameRule.value) {
    for (let subKey in gameRule.value[key]) {
      gameRule.value[key][subKey].forEach((item) => {
        item.bet = 0;
      });
    }
  }
};

// 查看当前下注值
const isBalance = ref<number>(0);
const ObservedVal = () => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  if (isActiveRank() && isBetArr()) {
    formatBetVal();
    isBalance.value = amounts.value.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
    if (isBalance.value > Number(userStore.userInfo.balance)) {
      message.error(t("game0.g3"), 1);
      resetVal();
    } else {
      showResultPop();
      previewBetPop();
    }
  }
};

const isActiveRank = () => {
  if (activeRank.value == null) {
    message.error(t("game0.g4"));
    addTipsClass()
    return false;
  } else {
    return true;
  }
};

const isBetArr = () => {
  if (subEvenOddVal.value.length < 1 && subEvenNumber.value.length < 1) {
    message.error(t("game0.g5"));
    return false;
  } else {
    return true;
  }
};

// 倒计时变化
let hasPrinted = false;
const onChange = (e) => {
  if (e.total <= aboutTime.value * 1000 && !hasPrinted) {
    aboutFun();
    hasPrinted = true;
  }
};

// 倒计时结束
const onFinish = () => {
  EntertainedFun();
  resetVal();
};

const amounts = ref([]);
const betcodes = ref([]);
// 格式化下注数组
const formatBetVal = () => {
  betcodes.value = [
    ...subEvenOddVal.value.map((item) => item.id),
    ...subEvenNumber.value.map((item) => item.id),
  ];
  amounts.value = [
    ...subEvenOddVal.value.map((item) => item.bet),
    ...subEvenNumber.value.map((item) => item.bet),
  ];
};
let previewArr = ref([]);
// 预览下注内容
const previewBetPop = () => {
  previewArr.value = [];
  for (const key1 in gameRule.value) {
    if (gameRule.value.hasOwnProperty(key1)) {
      for (const key2 in gameRule.value[key1]) {
        if (gameRule.value[key1].hasOwnProperty(key2)) {
          const filteredItems = gameRule.value[key1][key2].filter(
            (item) => item.bet !== 0
          );
          previewArr.value.push(...filteredItems);
        }
      }
    }
  }
};
const submitBetting = async () => {
  resultPop.value = false;
  message.info("Loading...", 2);
  try {
    const res = await betOrderApi({
      game_id: gameId,
      game_code: gameCode,
      expect: nowPeriod.value.expect,
      amounts: amounts.value,
      betcodes: betcodes.value,
    });
    if (res.success) {
      message.success(res.message);
      userStore.setUserInfo(res.data.balance, "balance");
      resetVal();
    } else {
      message.error(res.message);
      resetVal();
    }
  } catch (error) { }
};
const getGameInfo = async (code, expectVal) => {
  try {
    const res = await lastOrderInfoApi({
      game_code: code,
      expect: expectVal,
    });
    if (res.success) {
      userStore.setUserInfo(res.data.balance, "balance");
    }
  } catch (error) { }
};
onBeforeUnmount(() => {
  // 清除ping
  clearInterval(pingInterval);
  window.removeEventListener("resize", checkHeight);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
/**
 * 页面弹窗
 * @param resultPop 下注框
 * @param gameRulePop 游戏规则
 * @param historyListPop 历史记录
 * @param trendListPop 走势列表
 * @param gameRoomPop 切换房间
 */
const resultPop = ref(false);
const showResultPop = () => {
  resultPop.value = true;
};
const gameRulePop = ref(false);
const showGameRule = () => {
  gameRulePop.value = true;
};
const historyListPop = ref(false);
const showHistoryList = () => {
  historyListPop.value = true;
};
const trendListPop = ref(false);
const showTrendList = () => {
  trendListPop.value = true;
};
const gameRoomPop = ref(false);
const showgameRoomList = () => {
  gameRoomPop.value = true;
};
const ruleIndex = ref(null);
const openRuleDiv = (val, i) => {
  if (ruleIndex.value != null) {
    ruleIndex.value = null;
  } else {
    ruleIndex.value = i;
    if (gameCode == "town") {
      switch (i) {
        case 0:
          ruleList.value = [5, 6, 7, 8];
          break;
        case 1:
          ruleList.value = [1, 2, 3, 4];
          break;
        case 2:
          ruleList.value = [1, 3, 5, 7];
          break;
        case 3:
          ruleList.value = [2, 4, 6, 8];
          break;
      }
    } else {
      switch (i) {
        case 0:
          ruleList.value = [6, 7, 8, 9, 10];
          break;
        case 1:
          ruleList.value = [1, 2, 3, 4, 5];
          break;
        case 2:
          ruleList.value = [1, 3, 5, 7, 9];
          break;
        case 3:
          ruleList.value = [2, 4, 6, 8, 10];
          break;
      }
    }
  }
};

// 点击页面其他部分隐藏气泡框
const handleClickOutside = (event: MouseEvent) => {
  const tooltipContainer = document.querySelector(".ruleDiv");
  if (tooltipContainer && !tooltipContainer.contains(event.target as Node)) {
    ruleIndex.value = null;
  }
};

// 添加事件监听器
document.addEventListener("click", handleClickOutside);
const goback = () => {
  router.push("/");
};

// 音效
const audio = ref(null); // 创建一个 ref 来引用音频元素
const playSound = (sound) => {
  if (audio.value) {
    audio.value.src = sound; // 设置音频源
    audio.value.currentTime = 0; // 确保从头开始播放
    audio.value.play();
  }
};

// 赛道位置闪烁提示
const rankingDiv = ref(null); // 创建一个 ref 来引用 ranking div
const addTipsClass = () => {
  if (rankingDiv.value) {
    // 获取所有 class 为 item 的元素
    const items = rankingDiv.value.getElementsByClassName('item');
    // 遍历所有 item，给每个 item 添加类名 tips
    Array.from(items).forEach(item => {
      item.classList.add('tips');
    });
    // 设置 n 秒后删除 tips 类名
    setTimeout(() => {
      Array.from(items).forEach(item => {
        item.classList.remove('tips');
      });
    }, 800);
  }
};

const gameTabIndex = ref(0)
const changeGameFun = (i) => {
  gameTabIndex.value = i
}
const countLoading = ref(true)
const onFinishPredict = () => {
  countLoading.value = false
  if (predictTime.value < -1) {
    countLoading.value = true
  } else {
    countLoading.value = false
  }
}
const gotoNewGame = () => {
  router.push({
    name: "Game",
    params: { gameId, gameCode },
  });
}
</script>

<template>
  <!-- <a-spin tip="Loading..." :spinning="spinning"> -->
  <van-empty style="padding: 100px 0 0 0" image="network" :description="t('hint.h20')" v-if="network" />
  <div class="pages" v-else>
    <div class="gameInfo">
      <div class="game_top_info">
        <div class="game_top">
          <van-icon class="revoke" name="revoke" @click="goback" />
          <div>
            <div class="countDown" v-if="Entertained">
              <van-count-down :time="countDownVal" @finish="onFinish" @change="onChange">
                <template #default="timeData">
                  <span :class="`block ${aboutFunVal ? 'aboutStyle' : ''}`">{{
                    timeData.minutes
                  }}</span>
                  <span :class="`colon ${aboutFunVal ? 'aboutStyle' : ''}`">:</span>
                  <span :class="`block ${aboutFunVal ? 'aboutStyle' : ''}`">{{
                    timeData.seconds
                  }}</span>
                  <p v-if="aboutFunVal" class="aboutStyle abouText">
                    {{ $t("game0.g6") }}
                  </p>
                </template>
              </van-count-down>
            </div>
            <p v-else class="entertained">{{ $t("game0.g7") }}</p>
            <div class="nowPeriod">
              <p>{{ code_name }}</p>
              <p>{{ nowPeriod.expect }}</p>
              <p>{{ $t("game0.g8") }}</p>
            </div>
          </div>
        </div>
        <div class="game_top_icon">
          <div class="gameIcon" @click="showGameRule">
            <van-icon name="question-o" />
          </div>
          <div class="gameIcon">
            <van-icon name="chart-trending-o" @click="showHistoryList" />
          </div>
          <div class="gameIcon">
            <van-icon name="orders-o" @click="showTrendList" />
          </div>
          <div class="gameIcon">
            <van-icon name="exchange" @click="showgameRoomList" />
          </div>
        </div>
      </div>
      <div class="issueNum" v-if="invalid">
        <p>{{ lastPeriod.expect }}</p>
        <div class="flex_g">
          <div class="item" v-for="(item, index) of resultArray" :key="index">
            <img :src="MarblesMap[item]" alt="" />
          </div>
        </div>
      </div>
      <div class="issueNum" v-else>
        <p>{{ lastPeriod.expect }} {{ $t("game0.g8") }}</p>
        <p>{{ $t("game0.g9") }}</p>
      </div>
    </div>
    <div class="iframeBox">
      <WebVideo v-if="gameLive != ''" :liveUrl="gameLive" />
    </div>
    <div class="cover" v-if="!Entertained">
      <div class="predict">
        <p>{{ $t("game0.g77") }}</p>
        <van-count-down v-if="countLoading" :time="predictTime" @finish="onFinishPredict">
          <template #default="timeData">
            <span>{{ timeData.minutes }}</span>
            <span>:</span>
            <span>{{ timeData.seconds }}</span>
          </template>
        </van-count-down>
        <p style="color: #fff;" v-else>{{ $t("game0.g76") }}</p>
      </div>
    </div>
    <div class="betBox">
      <div class="Betting">
        <div class="gameTabs">
          <p :class="gameTabIndex == 0 ? 'act' : ''" @click="changeGameFun(0)">{{ $t("game0.g51") }}</p>
          <p :class="gameTabIndex == 1 ? 'act' : ''" @click="changeGameFun(1)">{{ $t("game0.g50") }}</p>
        </div>
        <div class="ranking" ref="rankingDiv">
          <div :class="`item ${activeRank === index ? 'act' : ''}`" v-for="(item, index) in gameRule" :key="index"
            @click="setActiveRank(index)">
            <p v-if="index < 1 || index > 3">{{ index }}</p>
            <p>
              {{
                ["", $t("game0.g10"), $t("game0.g11"), $t("game0.g12")][index]
              }}
            </p>
            <img v-if="index >= 1 && index <= 3" :src="[ranking1, ranking2, ranking3][index - 1]" alt="" />
          </div>
        </div>
        <div class="playNum" v-if="gameRule[nowRankVal]">
          <!-- 大小单双 -->
          <div class="odd-even" v-if="gameTabIndex == 0">
            <div :class="`item ${item.bet != 0 ? 'act' : ''}`" v-for="(item, index) of gameRule[nowRankVal][2]"
              :key="index" @click="setActiveEvenOdd(item, index)">
              <p class="rule" @click.stop="openRuleDiv(item, index)">?</p>
              <div class="ruleDiv" v-if="ruleIndex == index">
                <p v-for="(rule, n) of ruleList" :key="n">{{ rule }}</p>
              </div>
              <p class="itemName">{{ item.name }}</p>
              <p class="absVal" v-if="item.bet != 0">
                {{ item.bet }}
              </p>
              <p class="lossNum">{{ item.oddsName }}</p>
            </div>
          </div>
          <!-- 弹珠号码 -->
          <div class="numberVal" v-if="gameTabIndex == 1">
            <div :class="`item ${item.bet != 0 ? 'act' : ''}`" v-for="(item, index) of gameRule[nowRankVal][1]"
              :key="index" @click="setActiveNumber(item, index)">
              <img :src="MarblesMap[item.name]" alt="" />
              <p class="absVal" v-if="item.bet != 0">
                {{ item.bet }}
              </p>
              <p class="lossNum">{{ item.oddsName }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="footerSubmit">
        <div class="chip">
          <div class="customChip" @click="openCustomShow">
            <img :src="chip0" alt="" />
            <p>{{ $t("game0.g13") }}</p>
          </div>
          <div class="slideBox">
            <div class="inline_flex">
              <div :class="`chipItem ${activeChip === index ? 'actChip' : ''}`" v-for="(item, index) of chipVal"
                :key="index" @click="setActiveChip(index, item.val)">
                <div class="customChipText" v-if="item.isCheck">
                  <img :src="item.icon" alt="" />
                  <p v-if="item.icon == chip0">{{ item.val }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="footer_info">
          <div class="footer_item">
            <div class="item">
              <p>{{ $t("game0.g14") }}:</p>
              <p v-if="isBalanceShow">{{ userStore.userInfo.balance }}</p>
              <p v-else>**</p>
              <van-icon :class="isBalanceShow ? '' : 'act'" name="replay" @click="getUserBalance" />
            </div>
            <div class="item">
              <p>{{ $t("game0.g15") }}:</p>
              <p>{{ isBalance }}</p>
            </div>
          </div>
          <div class="footerBtn">
            <p class="btn reset" @click="resetVal">{{ $t("game0.g16") }}</p>
            <p class="btn submit" @click="ObservedVal">{{ $t("game0.g17") }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- </a-spin> -->
  <PopUps :isShow="customShow" :title="$t('game0.g18')" @close="closeCustomPop">
    <div class="customBox">
      <div class="box">
        <div class="item" :class="{ actChoose: !item.isCheck }" v-for="(item, index) of costomList" :key="index"
          @click="setChooseChip(item.val, index)">
          <img :src="item.icon" alt="" />
        </div>
        <div :class="`item ${customInput ? '' : 'actChoose'}`" @click="setChooseChip('custom')">
          <div class="customChip" style="margin: 0" @click="customShow = true">
            <img :src="chip0" alt="" />
            <p>{{ $t("game0.g13") }}</p>
          </div>
        </div>
      </div>
      <div class="inputBox" v-if="customInput">
        <input type="number" v-model="chipInputVal" :placeholder="$t('game0.g37')" />
        <p class="btn" @click="addChipList">{{ $t("hint.h16") }}</p>
      </div>
      <div class="footerBtn">
        <p class="btn confirm" @click="submitChipVal">{{ $t("hint.h16") }}</p>
        <p class="btn cancel" @click="closeCustomPop">{{ $t("hint.h21") }}</p>
      </div>
    </div>
  </PopUps>
  <van-popup v-model:show="resultPop" position="bottom" round :style="{ minHeight: '50%' }">
    <div class="result_popBox">
      <div class="result_popHead">
        <p>{{ $t("game0.g19") }}</p>
      </div>
      <div class="result_resultBox">
        <div class="table">
          <div class="title">
            <p>{{ $t("game0.g20") }}</p>
            <p>{{ $t("game0.g21") }}</p>
            <p>{{ $t("game0.g22") }}</p>
          </div>
          <div class="tableTd">
            <div class="item_row" v-for="(item, index) of previewArr" :key="index">
              <div class="number">
                <p v-if="item.category < 1 || item.category > 3">
                  {{ item.category }}
                </p>
                <p v-if="item.category < 4">
                  {{
                    ["", $t("game0.g10"), $t("game0.g11"), $t("game0.g12")][
                    item.category
                    ]
                  }}
                </p>
                <p>
                  {{ item.name }}
                </p>
              </div>
              <p v-if="item.oddsName">{{ item.oddsName }}</p>
              <p>{{ item.bet }}</p>
            </div>
          </div>
        </div>
      </div>
      <p class="result_btn" @click="submitBetting">{{ $t("hint.h16") }}</p>
    </div>
  </van-popup>
  <van-popup v-model:show="gameRulePop" position="bottom" closeable round :style="{ height: '50%' }">
    <div class="popUp rulePop" v-if="gameCode == 'town'">
      <p>{{ $t("game0.g23") }}</p>
      <p>{{ $t("game0.g24") }}</p>
      <p>{{ $t("game0.g25") }}</p>
      <p>{{ $t("game0.g26") }}</p>
      <p>{{ $t("game0.g27") }}</p>
    </div>
    <div class="popUp rulePop" v-else>
      <p>{{ $t("game0.g47") }}</p>
      <p>{{ $t("game0.g24") }}</p>
      <p>{{ $t("game0.g48") }}</p>
      <p>{{ $t("game0.g26") }}</p>
      <p>{{ $t("game0.g49") }}</p>
    </div>
  </van-popup>
  <van-popup v-model:show="historyListPop" position="bottom" round>
    <HistoryPop v-if="historyListPop" :gameCode="gameCode" />
  </van-popup>
  <van-popup v-model:show="trendListPop" position="bottom" round>
    <OpenVal v-if="trendListPop" :gameCode="gameCode" />
  </van-popup>
  <van-popup v-model:show="gameRoomPop" position="bottom" round>
    <GameList v-if="gameRoomPop" />
  </van-popup>
  <LottieAnimation :animation-path="LottieAnimationUrl" :amount="gameWinVal" v-if="gameWin" @closeFun="closeFun" />
  <audio ref="audio" :src="soundFile1" preload="auto"></audio>
  <!-- <van-floating-bubble class="easy" axis="xy" icon="chat" magnetic="x" @click="gotoNewGame">
    {{ $t("game0.g78") }}
  </van-floating-bubble> -->
</template>


<style lang="scss" scoped>
@import url("./primitiveIndex.scss");
</style>