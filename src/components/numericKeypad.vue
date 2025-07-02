<template>
    <van-popup
      v-model:show="show"
      position="bottom"
      :round="true"
      style="background: rgba(0,0,0,0) !important;"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.0)' }"
      @closed="onClosed"
    >
      <div class="popup">
        <div
          class="item"
          v-for="v in 5"
          :key="'top-' + v"
          @click="emitChange(v)"
        >
          {{ v }}
        </div>
        <div class="item" @click="emitChange(-1)">
          <van-icon name="arrow-left" size="18px" color="#f4cc00" />
        </div>
        <div
          class="item"
          v-for="v in [6, 7, 8, 9, 0]"
          :key="'bottom-' + v"
          @click="emitChange(v)"
        >
          {{ v }}
        </div>
        <div class="item" @click="emitClose">
          <van-icon name="success" size="18px" color="#f4cc00" />
        </div>
      </div>
    </van-popup>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { Popup, Icon } from 'vant'
  import 'vant/lib/index.css'
  
  const props = defineProps({
    popupShow: {
      type: Boolean,
      default: false
    }
  })
  
  const emits = defineEmits(['popup_close', 'change'])
  
  const show = ref(false)
  
  watch(
    () => props.popupShow,
    (val) => {
      show.value = val
    },
    { immediate: true }
  )
  
  const emitChange = (val) => {
    emits('change', val)
  }
  
  const emitClose = () => {
    show.value = false
    emits('popup_close', false)
  }
  
  const onClosed = () => {
    emits('popup_close', false)
  }
  </script>
  
  <style scoped lang="scss">
  .popup {
    width: calc(100vw - 48px);
    max-width: 330px;
    max-height: 600px;
    margin: 0 auto;
    background-color: #021547;
    border-radius: 10px 10px 0 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 10px;
  
    .item {
      width: 46px;
      height: 34px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 4px;
      background-color: #1c348d;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #e8eef7;
      font-size: 12px;
      cursor: pointer;
  
      &:active {
        background-color: #2f96f0;
      }
    }
  }
  </style>
  