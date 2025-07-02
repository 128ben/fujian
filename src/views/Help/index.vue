<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const activeName = ref("1");
const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <div class="head">
    <van-icon name="arrow-left" @click="goBack" />
    <p>{{ $t("help0.h1") }}</p>
  </div>
  <div class="pages">
    <van-collapse v-model="activeName" accordion>
      <van-collapse-item :title="$t('help0.h9')" name="1">
        {{ $t("help0.h2") }}
        <br />
        {{ $t("help0.h3") }}
      </van-collapse-item>
      <van-collapse-item :title="$t('help0.h10')" name="2">
        {{ $t("help0.h4") }}<br />
        {{ $t("help0.h5") }}<br />
        {{ $t("help0.h6") }}<br />
        C{{ $t("help0.h7") }}
      </van-collapse-item>
      <van-collapse-item :title="$t('help0.h11')" name="3">
        {{ $t("help0.h8") }}
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<style lang="scss">
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

.pages {
  padding: 60px 0;
}

.van-cell {
  background: none;
  color: #fff;
}

.van-cell--clickable:active,
.van-collapse-item__content {
  background: none !important;
}

.van-hairline--top-bottom:after {
  border: none !important;
}

.van-hairline-unset--top-bottom:after {
  border: none !important;
}
</style>