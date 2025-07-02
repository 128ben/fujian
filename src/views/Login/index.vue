<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import LoginForm from "./LoginForm.vue";
import RegisterForm from "./RegisterForm.vue";
const props = defineProps({
  isShow: {
    type: Boolean,
    default: false,
  },
  type: {
    type: Number,
    default: 0,
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
const finishRegister = (val: Number) => {
  emit("close", val);
};
</script>
<template>
  <div v-if="isShow" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <!-- <div class="logo">LOGO</div> -->
      <LoginForm v-if="props.type == 0" @finish="finishRegister" />
      <RegisterForm v-if="props.type == 1" @finish="finishRegister" />
      <div class="closeBtn" @click="handleCancel">
        <CloseOutlined />
      </div>
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
  background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  position: relative;
  background: #182234;
  padding: 20px 10px 0;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.closeBtn {
  margin-top: 10px;
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translate(-50%, 0%);
  border: 1px solid #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>