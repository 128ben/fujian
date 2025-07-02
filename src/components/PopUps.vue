<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
const props = defineProps({
  isShow: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits();
const handleOverlayClick = () => {
  handleCancel();
};
const handleOk = () => {
  emit("close");
};

const handleCancel = () => {
  emit("close");
};
</script>
<template>
  <div v-if="isShow" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="head">
        <p>{{ props.title }}</p>
        <div class="closeBtn" @click="handleCancel">
          <CloseOutlined />
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  position: relative;
  background: #4c4c4c;
  border-radius: 10px;
  overflow: auto;
  width: 80%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  &::-webkit-scrollbar {
    display: none;
  }
}
.head {
  width: 100%;
  height: 44px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #4c4c4c;
  p {
    color: $textColor;
    text-align: center;
    font-family: Inter;
    font-size: 18px;
    font-weight: 600;
  }
  .closeBtn {
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 5px;
    top: 5px;
  }
}
@media screen and (min-width: 992px) {
  .modal-content {
    width: 600px;
    height: 700px;
  }
}
</style>