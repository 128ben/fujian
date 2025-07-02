<template>
  <div class="pagesInvite">
    <!-- <van-tabs line-width="70px" v-model:active="tabIndex" @change="tabChange">
      <van-tab v-for="(item, index) of tabsTitle" :key="index" :title="$t(item.title)">
      </van-tab>
    </van-tabs> -->
    <div class="tabItemBox" v-if="tabIndex == 0">
      <div class="inviterAvatar">
        <CoinAnimation />
        <div class="avatarRound">
          <!-- <img :src="userStore.userInfo.avatar" alt="" /> -->
          <img src="@/assets/images/avatar.png" alt="" />
        </div>
      </div>
      <div class="inviteText">
        <h1>{{ $t("invite0.i4") }}</h1>
        <p>
          {{ $t("invite0.i5") }} <b>{{ $t("invite0.i6") }}</b>
        </p>
      </div>
      <div class="shareBox">
        <p class="ptitle">{{ $t("invite0.i7") }}</p>
        <div class="flex_icon">
          <img :src="item" v-for="(item, index) of shareList" :key="index" alt="" @click="gotoApp(index)" />
        </div>
        <p class="ptitle">{{ $t("invite0.i8") }}</p>
        <div class="felxBtn">
          <div class="IconBtn">
            <p>{{ `${loacHost}?invite=${data.invite}` }}</p>
          </div>
          <div class="IconBtn" @click="copyLink(`${loacHost}?invite=${data.invite}`)">
            <CopyOutlined />
          </div>
          <div class="IconBtn" @click="qrCodeShow = true">
            <van-icon name="qr" />
          </div>
        </div>
        <!-- 遮罩 -->
        <div class="zhezhao" v-if="userStore.userInfo.is_analog == 1">游客用户暂不可预览</div>
      </div>
      <div class="publicity">
        <div class="icon">
          <p>{{ $t("invite0.i9") }}</p>
          <img :src="inviteImg" alt="" />
        </div>
        <div class="itemlist">
          <div class="item">
            <p>{{ $t("invite0.i10") }}</p>
            <img :src="inviteGift1" alt="" />
          </div>
          <div class="item">
            <p>{{ $t("invite0.i11") }}</p>
            <img :src="inviteGift2" alt="" />
          </div>
          <div class="item">
            <p>{{ $t("invite0.i12") }}</p>
            <img :src="inviteGift3" alt="" />
          </div>
        </div>
      </div>
      <!-- <div class="inviteDiv">
        <div class="space-y-2">
          <img class="coinImg" :src="coinImg" alt="" />
          <div class="invite_rule">
            <p>{{ $t("invite0.i4") }}</p>
            <div class="invite_rule_item">
              <div>
                <img :src="giftImg" alt="" />
              </div>
              {{ $t("invite0.i13") }} {{ data.gift_money }}
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text">
            {{ $t("invite0.i14") }}
            <span>{{ $t("invite0.i15") }}</span> {{ $t("invite0.i16") }}
          </p>
        </div>
      </div> -->
      <!-- <div class="treasureBox">
        <div class="flexTitle">
          <p>{{ $t("invite0.i6") }}({{ data.received_num }})</p>
          <div class="already" @click="alreadyValFun">
            <p v-if="!showStatusOne">{{ $t("invite0.i52") }}</p>
            <p v-else>{{ $t("invite0.i53") }}</p>
            <van-icon v-if="!showStatusOne" name="eye-o" />
            <van-icon v-else name="closed-eye" />
          </div>
          <div class="flexText">
            <p>{{ $t("invite0.i17") }}</p>
            <p>{{ data.received_amount }}</p>
            <img :src="coinImg" alt="" />
          </div>
        </div>
        <div class="treasureList">

          <div class="item" v-for="(item, index) of filteredList" :key="index" @click="openBXVal(item)">
            <div class="iconBox">
              <img :src="treasureMap[item.status]" alt="" />
              <p v-if="item.status != 2" :style="item.status == 0
                ? 'color: #FFD900'
                : item.status == 1
                  ? 'color:#59420e'
                  : ''
                ">
                {{ item.price }}
              </p>
            </div>
            <p :class="`getBXType ${item.status == 0
              ? 'noReceived'
              : item.status == 1
                ? 'received'
                : 'noObtained'
              }`">
              {{
                item.status == 0
                  ? $t("invite0.i18")
                  : item.status == 1
                    ? $t("invite0.i17")
                    : $t("invite0.i19")
              }}
            </p>
          </div>
        </div>
      </div> -->
    </div>
    <div class="tabItemBox" v-if="tabIndex == 1">
      <Myfriend />
    </div>
    <div class="tabItemBox" v-if="tabIndex == 2">
      <TeamList />
    </div>
    <van-dialog v-model:show="qrCodeShow" :title="$t('invite0.i20')" show-cancel-button
      :confirmButtonText="$t('invite0.i21')" :cancelButtonText="$t('hint.h21')" @confirm="dowloadChange">
      <div class="qrBox">
        <a-qrcode ref="qrcodeCanvasRef" :value="`${loacHost}?invite=${data.invite}`" />
      </div>
    </van-dialog>
    <!-- <van-dialog v-model:show="bxValPop" title="宝箱奖励" show-cancel-button confirmButtonText="领取" @confirm="getBXVal">
      <div class="bxPop">
        <p>可领取奖励</p>
        <b>{{ bxValNum }}</b>
      </div>
    </van-dialog> -->
    <van-popup class="treasureBox" v-model:show="bxValPop">
      <div class="award">
        <img class="light" :src="light_pop" alt="" />
        <p class="title"> {{ $t('invite0.i6') }}</p>
        <div class="content">
          <div>
            <p>
              {{ $t('invite0.i49') }} <b>{{ bxValNum }}</b>
            </p>
          </div>
          <div class="btn" @click="getBXVal">{{ $t("hint.h16") }}</div>
          <p> {{ $t('invite0.i50') }}</p>
        </div>
        <van-icon name="close" class="closeIcon" @click="bxValPop = false" />
      </div>
    </van-popup>
  </div>
</template>
<script setup>
import { onMounted, ref, computed } from "vue";
import { CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/useUserStore";
import { InviteApi, getTreasureApi } from "@/utils/api";
import CoinAnimation from "@/components/CoinAnimation.vue";
import Myfriend from "./components/friendList.vue";
import TeamList from "./components/teamList.vue";
import confetti from "canvas-confetti";
import light_pop from "@/assets/img/light_pop.png";
import coinImg from "@/assets/img/jinbi.png";
import giftImg from "@/assets/svg/liwu.svg";
import treasure0 from "@/assets/img/bx0.png";
import treasure1 from "@/assets/img/bx1.png";
import treasure2 from "@/assets/img/bx2.png";
import app1 from "@/assets/img/tk.png";
import app2 from "@/assets/img/facebook.png";
import app3 from "@/assets/img/tg.png";
import app4 from "@/assets/img/ws.png";
import app5 from "@/assets/img/ins.png";
import inviteImg from "@/assets/img/inviteGift.png";
import inviteGift1 from "@/assets/img/g1.png";
import inviteGift2 from "@/assets/img/g2.png";
import inviteGift3 from "@/assets/img/g3.png";
const { t } = useI18n();
const treasureMap = [treasure0, treasure1, treasure2];
const shareList = [app1, app2, app3, app4, app5];
const loacHost = ref(location.origin);
const userStore = useUserStore();
// 控制显示状态的变量
const showStatusOne = ref(true);
// 计算属性，用于过滤列表项
const filteredList = computed(() => {
  return treasureList.value.filter(item => !showStatusOne.value || item.status !== 1);
});
const alreadyValFun = () => {
  showStatusOne.value = !showStatusOne.value;
}
const tabsTitle = [
  {
    title: "invite0.i1",
  },
  {
    title: "invite0.i2",
  },
  {
    title: "invite0.i3",
  },
];
const tabIndex = ref(0);

onMounted(() => {
  getData();
});
const data = ref({});
const treasureList = ref([]);

const getData = async () => {
  const res = await InviteApi({});
  if (res.success == 200) {
    data.value = res.data;
    // treasureList.value = res.data.list;
  }
};
//
const copyLink = async (val) => {
  try {
    await navigator.clipboard.writeText(val);
    message.success(t('cz0.c4'));
  } catch (err) {
    console.error("复制失败:", err);
  }
};
const bxValPop = ref(false)
const bxValNum = ref(0)
const bxInfoVal = ref({})
const openBXVal = (val) => {
  if (val.status != 0) return false;
  bxInfoVal.value = val
  bxValNum.value = val.price
  bxValPop.value = true
}
const getBXVal = async () => {
  bxValPop.value = false
  message.loading("Loading...");
  try {
    const res = await getTreasureApi({
      type: bxInfoVal.value.status,
      id: bxInfoVal.value.id,
    });
    if (res.success) {
      message.success(res.message);
      confetti({
        particleCount: 150,
        spread: 60,
      });
      getData();
    }
  } catch (error) { }
};

const qrcodeCanvasRef = ref();
const qrCodeShow = ref(false);

const dowloadChange = async () => {
  const url = await qrcodeCanvasRef.value.toDataURL();
  const a = document.createElement("a");
  a.download = "QRCode.png";
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
const gotoApp = (i) => {
  const url = encodeURIComponent(`${loacHost.value}?invite=${data.value.invite}`);
  const title = encodeURIComponent(t('hint.h28'));

  switch (i) {
    case 0: // tiktok 分享
      alert(t('hint.h29'));
      break;
    case 1: // Facebook 主页
      window.open("https://www.facebook.com", "_blank");
      break;
    case 2: // Telegram 分享
      window.open(`https://t.me/share/url?url=${url}&text=${title}`, "_blank");
      break;
    case 3: // WhatsApp 分享
      window.open(`https://api.whatsapp.com/send?text=${title} ${url}`, "_blank");
      break;
    case 4: // Instagram 主页
      alert(t('hint.h30')); // Instagram 不支持直接分享链接
      break;
  }
};
const tabChange = (e) => {
  if (e == 0) {
    getData()
  }
}
</script>

<style lang="scss" scoped>
@import url("./index.scss");
</style>
<style scoped>
@import url("../Ranking/index.scss");
</style>
<style lang="scss" scoped>
.award {
  width: 80vw;
  height: 50vh;
  margin: auto;
  border-radius: 10px;
  background: url("@/assets/img/award.png") no-repeat;
  background-size: contain;
  background-position: center;
  padding: 17vh 0 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  .light {
    position: absolute;
    top: 0;
    z-index: -1;
    width: 70%;
    animation: award 3s linear infinite;
  }

  .title {
    color: #fff;
    text-align: center;
    font-size: 20px;
    margin: 0 0 0 3vw;
    font-weight: 700;
  }

  .content {
    width: 74%;
    margin: 2vh 0 0 3vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666;

    &>div:first-child {
      p {
        color: #030616;
        text-align: center;
        font-family: "Microsoft YaHei UI";
        font-weight: 400;
      }

      b {
        color: #f80;
        text-align: center;
        font-family: "Microsoft YaHei UI";
        font-size: 28px;
        font-weight: 700;
        margin: 0 4px;
      }
    }

    &>p:last-child {
      color: #666;
      text-align: center;
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
    }
  }

  .btn {
    display: flex;
    width: 168px;
    padding: 8px 10px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 500px;
    background: #febe29;
    color: #030616;
    margin: 2vh 0;
    font-weight: bold;
  }

  .closeIcon {
    position: absolute;
    font-size: 24px;
    top: 40px;
    right: 10px;
  }
}

@media only screen and (max-width: 320px) {

  /* 苹果5 */
  .award {
    padding: 16vh 0 0;

    .content {
      &>p:last-child {
        font-size: 10px;
      }
    }

    .btn {
      padding: 4px 6px;
      font-size: 14px;
    }
  }
}

@media only screen and (min-width: 375px) and (max-width: 812px) {
  .award {
    padding: 17.8vh 0 0;
  }
}

@media only screen and (min-width: 376px) and (max-width: 414px) {

  /* 苹果12 Pro */
  .award {
    padding: 18.5vh 0 0;
  }
}

@media only screen and (min-width: 415px) {

  /* 苹果14 Pro Max */
  .award {
    padding: 18.5vh 0 0;

    .title {
      font-size: 22px;
    }

    .content {
      &>div:first-child p {
        font-size: 20px;
      }

      &>p:last-child {
        font-size: 16px;
      }
    }
  }
}
</style>