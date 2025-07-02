<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showImagePreview } from 'vant';
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/useUserStore";
import {
  startGameApi,
  betOrderApi,
  lastOrderInfoApi,
  // userBalanceApi,
  getLastWinApi,
  getGameStatusApi,
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
// import rule1Img from "@/assets/img/rule1_pt.png";
// import rule2Img from "@/assets/img/rule2_pt.png";

// 新页面
import newGame1 from "@/assets/img/newGame1.png";
import newGame2 from "@/assets/img/newGame2.png";
import newGame3 from "@/assets/img/newGame3.png";
import newGame4 from "@/assets/img/newGame4.png";
import newGame5 from "@/assets/img/newGame5.png";
import newGame6 from "@/assets/img/newGame6.png";
import newGame7 from "@/assets/img/newGame7.png";
import newGame8 from "@/assets/img/newGame8.png";
import newGame9 from "@/assets/img/newGame9.png";
import newGame10 from "@/assets/img/newGame10.png";
import newGameXZ from "@/assets/svg/newGameXZ.svg";
import newGameAdd from "@/assets/svg/newGameAdd.svg";
import newGameSub from "@/assets/svg/newGameSub.svg";
import newGameQB from "@/assets/svg/newGameQB.svg";
import newGameWenhao from "@/assets/svg/newGameWenhao.svg";
import newGameJilu from "@/assets/svg/newGameJilu.svg";
import newGameJieguo from "@/assets/svg/newGameJieguo.svg";
import newGameQiehuan from "@/assets/svg/newGameQiehuan.svg";

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
  1: chip1,
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
const win_amount = ref(0)
const noticeVal = ref("")
const noeLevel = ref(0)
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
      noeLevel.value = res.data.level
      gameLive.value = res.data.webrtc
      noticeVal.value = res.data.describe
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
      // chipVal.value = res.data.betAmount.map((amount) => ({
      //   val: amount,
      //   icon: chipMap[amount],
      //   isCheck: true,
      // }));
      costomList.value = res.data.betAmount.map((amount) => ({
        val: amount,
        icon: chipMap[amount],
        isCheck: false,
      }));
      // 筹码初始值
      if (localStorage.getItem('activeChipVal')) {
        activeChipVal.value = costomList.value[localStorage.getItem('activeChipVal')].val;
      } else {
        activeChipVal.value = costomList.value[0].val;
      }
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
      getLastWinFun()
      getblc()
    } else if (res.step == "refund") {
      getblc()
    }
  }
};
const getLastWinFun = async () => {
  try {
    const res = await getLastWinApi({});
    if (res.success) {
      win_amount.value = res.data.win_amount
    }
  } catch (error) { }
}
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
  getLastWinFun()
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

// 大小
const subSize = ref([]);
const setActiveSize = (val, i) => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  playSound(sound2)
  if (isActiveRank()) {
    if (activeChipVal.value.length < 1) {
      addChipTipsClass()
      message.error(t("game0.g73"))
      return false
    }
    const index = subSize.value.indexOf(val);
    if (index === -1) {
      subSize.value.push(val);
    }
    gameRule.value[nowRankVal.value][2][i].bet += activeChipVal.value;
    formatBetVal();
    isBalance.value = amounts.value.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
  }
};
// 单双
const subEvenOdd = ref([]);
const setActiveEvenOdd = (val, i) => {
  if (!Entertained.value) {
    message.error(t("game0.g1"), 1);
    return false;
  }
  playSound(sound2)
  if (isActiveRank()) {
    if (activeChipVal.value.length < 1) {
      addChipTipsClass()
      message.error(t("game0.g73"))
      return false
    }
    const index = subEvenOdd.value.indexOf(val);
    if (index === -1) {
      subEvenOdd.value.push(val);
    }
    gameRule.value[nowRankVal.value][2].slice(2)[i].bet += activeChipVal.value;
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
    if (activeChipVal.value.length < 1) {
      addChipTipsClass()
      message.error(t("game0.g73"))
      return false
    }
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
const costomList = ref([]); // 自定义筹码数组
const activeChip = ref(localStorage.getItem('activeChipVal') || 0); //选中筹码下标
const activeChipVal = ref([]); // 选中筹码值
const currentChip = computed({
  get() {
    return costomList.value[activeChip.value].val
  },
  set(newVal) {
    setTimeout(() => {
      costomList.value[0].val = newVal
    }, 10);
  }
})
const addSubChipVal = (i) => {
  if (i == 0) {
    activeChip.value = (activeChip.value - 1 + costomList.value.length) % costomList.value.length
  } else {
    activeChip.value = (activeChip.value + 1) % costomList.value.length
  }
  activeChipVal.value = costomList.value[activeChip.value].val
}
// 自定义筹码弹窗
const customShow = ref(false);
const openCustomShow = () => {
  customShow.value = true;
  costomList.value.forEach((item, index) => {
    item.isCheck = index === activeChip.value;
  });
  costomList.value[activeChip.value].isCheck = true
};
const addChipList = () => {
  if (chipInputVal.value == "") return false;
  if (costomList.value[0].icon.search("chip0") != -1) {
    costomList.value[0] = {
      val: chipInputVal.value,
      icon: chip0,
      isCheck: true,
    };
  } else {
    costomList.value.unshift({
      val: chipInputVal.value,
      icon: chip0,
      isCheck: true,
    });
  }
};
//筹码输入框
const chipInputVal = ref(currentChip || ""); //输入框值
const chipValChange = (e) => {
  costomList.value.forEach((item, index) => {
    item.isCheck = false;
  });
  activeChip.value = 0
  addChipList()
}
// 点击筹码
const setChooseChip = (val, i) => {
  activeChip.value = i
  localStorage.setItem("activeChipVal", i)
  activeChipVal.value = val
  costomList.value.forEach((item, index) => {
    item.isCheck = index === i;
  });
}
// 确认筹码
const submitChipVal = () => {
  activeChipVal.value = chipInputVal.value
  currentChip.value = chipInputVal.value
  closeCustomPop();
};
const closeCustomPop = () => {
  customShow.value = false;
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
  subSize.value = [];
  subEvenOdd.value = [];
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
      speedUp()
      showResultPop();
      previewBetPop();
    }
  }
};
const SwitchVersion = () => {
  router.push({
    name: "PrimitiveGame",
    params: { gameId, gameCode },
  });
}
const isActiveRank = () => {
  // if (activeRank.value == null) {
  //   message.error(t("game0.g4"));
  //   addTipsClass()
  //   return false;
  // } else {
  //   return true;
  // }
  return true;
};

const isBetArr = () => {
  if (subSize.value.length < 1 && subEvenOdd.value.length < 1 && subEvenNumber.value.length < 1) {
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
    ...subSize.value.map((item) => item.id),
    ...subEvenOdd.value.map((item) => item.id),
    ...subEvenNumber.value.map((item) => item.id),
  ];
  amounts.value = [
    ...subSize.value.map((item) => item.bet),
    ...subEvenOdd.value.map((item) => item.bet),
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
  message.info("Loading...", 1);
  try {
    const res = await betOrderApi({
      game_id: gameId,
      game_code: gameCode,
      expect: nowPeriod.value.expect,
      amounts: amounts.value,
      betcodes: betcodes.value,
    });
    if (res.success) {
      // if (noeLevel.value < 1) {
      //   setTimeout(() => {
      //     vipVisible.value = true
      //   }, 2000);
      //   setTimeout(() => {
      //     vipVisible.value = false
      //   }, 7000)
      // }
      message.success(res.message, 1);
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
// 筹码位置闪烁提示
const chipDiv = ref(null); // 创建一个 ref 来引用 chip div
const addChipTipsClass = () => {
  if (chipDiv.value) {
    // 获取所有 class 为 item 的元素
    const items = chipDiv.value.getElementsByClassName('chip');
    // 遍历所有 item，给每个 item 添加类名 tips
    Array.from(items).forEach(item => {
      item.classList.add('tips');
    });
    // 设置 n 秒后删除 tips 类名
    setTimeout(() => {
      Array.from(items).forEach(item => {
        item.classList.remove('tips');
      });
    }, 1000);
  }
};
const gameTabIndex = ref(0)
const changeGameFun = (i) => {
  gameTabIndex.value = i
}
const lookImg = (i) => {
  showImagePreview({
    images: [
      rule1Img, rule2Img
    ],
    startPosition: i,
    closeable: true,
  })
}
const isFast = ref(false)
const speedUp = () => {
  if (isFast.value) return // 避免重复触发

  isFast.value = true
  setTimeout(() => {
    isFast.value = false
  }, 2000)
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
const vipVisible = ref(false)
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
            <!-- <div v-if="vipVisible" class="popover">Jogo competitivo começa a contagem regressiva</div> -->
            <div class="nowPeriod">
              <p>{{ code_name }}</p>
              <p>{{ nowPeriod.expect }}</p>
              <p>{{ $t("game0.g8") }}</p>
            </div>
          </div>
        </div>
        <div class="game_top_icon">
          <div class="gameIcon">
            <img :src="newGameWenhao" alt="" @click="showGameRule">
          </div>
          <div class="gameIcon">
            <img :src="newGameJilu" alt="" @click="showHistoryList">
          </div>
          <div class="gameIcon">
            <img :src="newGameJieguo" alt="" @click="showTrendList">
          </div>
          <div class="gameIcon">
            <img :src="newGameQiehuan" alt="" @click="showgameRoomList">
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
      <div class="notice">
        <van-notice-bar speed="50" color="#FEBE29" scrollable :text="noticeVal" />
      </div>
      <div class="AmountBox">
        <div class="iconItem">
          <img :src="newGameQB" alt="">
          <p>{{ userStore.userInfo.balance }}</p>
        </div>
        <div class="addSub">
          <img @click="addSubChipVal(0)" :src="newGameSub" alt="">
          <p v-if="costomList[activeChip]" @click="openCustomShow">{{ currentChip }}</p>
          <img @click="addSubChipVal(1)" :src="newGameAdd" alt="">
        </div>
        <div class="iconItem">
          <img :src="newGame3" alt="">
          <p>{{ win_amount }}</p>
        </div>
      </div>
      <div class="Betting">
        <div class="gameTabs">
          <div :class="gameTabIndex == 0 ? 'act' : ''" @click="changeGameFun(0)">
            <p>{{ $t("game0.g45") }}</p>
            <p class="rank1">{{ $t("game0.g10") }} </p>
          </div>
          <div :class="gameTabIndex == 1 ? 'act' : ''" @click="changeGameFun(1)">
            <p>{{ $t("game0.g46") }}</p>
            <p class="rank1">{{ $t("game0.g10") }} </p>
          </div>
          <div :class="gameTabIndex == 2 ? 'act' : ''" @click="changeGameFun(2)">
            <p>{{ $t("game0.g50") }}</p>
            <p class="rank1">{{ $t("game0.g10") }} </p>
          </div>
        </div>
        <div class="playNum" v-if="gameRule[nowRankVal]">
          <!-- 大小 -->
          <div class="odd-even" v-if="gameTabIndex == 0">
            <div :class="`item ${item.bet != 0 ? 'act' : ''}`"
              v-for="(item, index) of gameRule[nowRankVal][2].slice(0, -2)" :key="index"
              @click="setActiveSize(item, index)">
              <p class="rule" @click.stop="openRuleDiv(item, index)">?</p>
              <div class="ruleDiv" v-if="ruleIndex == index">
                <p v-for="(rule, n) of ruleList" :key="n">{{ rule }}</p>
              </div>
              <p class="itemName">{{ item.name }}</p>
              <p class="absVal" v-if="item.bet != 0">
                {{ item.bet }}
              </p>
              <p class="lossNum" v-else>{{ item.oddsName }}</p>
            </div>
          </div>
          <!-- 单双 -->
          <div class="odd-even" v-if="gameTabIndex == 1">
            <div :class="`item ${item.bet != 0 ? 'act' : ''}`" v-for="(item, index) of gameRule[nowRankVal][2].slice(2)"
              :key="index" @click="setActiveEvenOdd(item, index)">
              <p class="rule" @click.stop="openRuleDiv(item, index)">?</p>
              <div class="ruleDiv" v-if="ruleIndex == index">
                <p v-for="(rule, n) of ruleList" :key="n">{{ rule }}</p>
              </div>
              <p class="itemName">{{ item.name }}</p>
              <p class="absVal" v-if="item.bet != 0">
                {{ item.bet }}
              </p>
              <p class="lossNum" v-else>{{ item.oddsName }}</p>
            </div>
          </div>
          <!-- 特码 -->
          <div class="numberVal" v-if="gameTabIndex == 2">
            <div :class="`item ${item.bet != 0 ? 'act' : ''}`" v-for="(item, index) of gameRule[nowRankVal][1]"
              :key="index" @click="setActiveNumber(item, index)">
              <img :src="MarblesMap[item.name]" alt="" />
              <p class="absVal" v-if="item.bet != 0">
                {{ item.bet }}
              </p>
              <p class="lossNum" v-else>{{ item.oddsName }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="footerSubmit" ref="chipDiv">
        <div class="new_footer">
          <div class="iconItem" @click="resetVal">
            <img :src="newGame7" alt="">
            <p>{{ $t("game0.g74") }}</p>
          </div>
          <div class="spinBtn" @click="ObservedVal">
            <img :class="{ 'spinning': true, 'fast': isFast }" :src="newGameXZ" alt="">
          </div>
          <div class="iconItem" @click="SwitchVersion">
            <img :src="newGame6" alt="">
            <p>{{ $t("game0.g75") }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- </a-spin> -->
  <PopUps :isShow="customShow" :title="$t('game0.g18')" @close="closeCustomPop">
    <div class="customBox">
      <div class="inputBox">
        <input type="number" v-model="chipInputVal" :placeholder="$t('game0.g37')" @input="chipValChange" />
      </div>
      <div class="box">
        <div class="item" :class="{ actChoose: !item.isCheck }" v-for="(item, index) of costomList" :key="index"
          @click="setChooseChip(item.val, index)">
          <img :src="item.icon" alt="" />
          <p v-if="item.icon == chip0">{{ item.val }}</p>
        </div>
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
                <p>
                  {{ item.category }}
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
  <van-popup v-model:show="gameRulePop" position="bottom" closeable round :style="{ height: '100%' }">
    <div class="popUp rulePop" v-if="gameCode == 'town'">
      <p>{{ $t('game0.g52') }}</p>
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 1:</p>
        <p>{{ $t('game0.g54') }}</p>
        <p>{{ $t('game0.g55') }}</p>
        <p>{{ $t('game0.g56') }}</p>
        <p>{{ $t('game0.g57') }}</p>
      </div>
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 2:</p>
        <p>{{ $t('game0.g58') }}</p>
        <p>{{ $t('game0.g59') }}r</p>
        <p>{{ $t('game0.g60') }}</p>
        <p>{{ $t('game0.g57') }}</p>
      </div>
      <img class="ruleImg" :src="rule1Img" @click="lookImg(0)" />
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 3:</p>
        <p>{{ $t('game0.g61') }}</p>
        <p>{{ $t('game0.g62') }}</p>
        <p>{{ $t('game0.g63') }}</p>
      </div>
      <img class="ruleImg" :src="rule2Img" @click="lookImg(1)" />
    </div>
    <div class="popUp rulePop" v-else>
      <p>{{ $t('game0.g52') }}</p>
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 1:</p>
        <p>{{ $t('game0.g64') }}</p>
        <p>{{ $t('game0.g65') }}</p>
        <p>{{ $t('game0.g66') }}</p>
        <p>{{ $t('game0.g57') }}</p>
      </div>
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 2:</p>
        <p>{{ $t('game0.g67') }}</p>
        <p>{{ $t('game0.g68') }}</p>
        <p>{{ $t('game0.g69') }}</p>
        <p>{{ $t('game0.g57') }}</p>
      </div>
      <img class="ruleImg" :src="rule1Img" @click="lookImg(0)" />
      <div class="ruleParagraph">
        <p>{{ $t('game0.g53') }} 3:</p>
        <p>{{ $t('game0.g70') }}</p>
        <p>{{ $t('game0.g71') }}</p>
        <p>{{ $t('game0.g63') }}</p>
      </div>
      <img class="ruleImg" :src="rule2Img" @click="lookImg(1)" />
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
</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>