<template>
  <van-overlay :show="show" @click="closeModal">
    <div class="wrapper" @click.stop>
      <div class="award">
        <img class="light" :src="light_pop" alt="" />
        <p class="title">{{ $t("invite0.i33") }}</p>
        <div class="content">
          <div>
            <p>
              {{ $t("invite0.i34") }} <b>{{ props.val }}</b> {{ $t("invite0.i35") }}
            </p>
          </div>
          <div class="btn" @click="closeModal">{{ $t("hint.h16") }}</div>
          <p>{{ $t("invite0.i36") }}</p>
        </div>
      </div>
    </div>
  </van-overlay>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineEmits, defineProps } from "vue";
import light_pop from "@/assets/img/light_pop.png";
const show = ref(true);
const props = defineProps({
  val: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(["close"]);
const closeModal = () => {
  emit("close");
};
</script>

<style lang="scss" scoped>
.award {
  width: 100vw;
  margin: 10vh auto 0;
  height: 59vh;
  border-radius: 10px;
  background: url("@/assets/img/award.png") no-repeat;
  background-size: contain;
  background-position: center;
  padding: 22vh 0 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
  .light {
    position: absolute;
    top: -5vh;
    z-index: -1;
    width: 80%;
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
    margin: 7vh 0 0 3vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666;
    & > div:first-child {
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
    & > p:last-child {
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
}
@media screen and (max-width: 375px) {
  .award {
    padding: 20vh 0 0;
  }
}

@media screen and (max-width: 320px) {
  .award {
    .title {
      font-size: 15px;
    }
    .btn {
      margin: 2px 0 10px;
      padding: 2px 4px;
    }
    .content {
      margin: 7vh 0 0 1vw;
      & > p:last-child {
        width: 80%;
        font-size: 10px;
      }
    }
  }
}
</style>