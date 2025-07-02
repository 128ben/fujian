<template>
  <canvas ref="coinCanvas"></canvas>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import coinImageSrc from "@/assets/img/jinbi.png";

export default {
  name: "CoinAnimation",
  setup() {
    const coinCanvas = ref(null);
    const coins = ref([]);
    let animationId = null;
    const coinImage = new Image();
    const maxDistance = Math.min(window.innerWidth, window.innerHeight) / 2; // 最大扩散距离
    const coinGenerationInterval = 1000; // 每秒生成10个金币的时间间隔
    let lastGenerationTime = 0; // 上次生成金币的时间
    const maxCoins = 50; // 最大金币数量

    const setupCanvas = () => {
      const canvas = coinCanvas.value;
      const ctx = canvas.getContext("2d");
      canvas.width = canvas.clientWidth; // 使用 CSS 设置的宽度
      canvas.height = canvas.clientHeight;

      // 生成初始的金币对象（只生成一半）
      for (let i = 0; i < 10; i++) {
        createCoin();
      }
    };

    const createCoin = () => {
      if (coins.value.length < maxCoins) {
        const size = Math.max(Math.random() * 20 + 10, 20); // 随机大小
        const speed = Math.random() * 1 + 1; // 随机速度
        const angle = Math.random() * 2 * Math.PI; // 随机角度
        const distance = 0; // 初始距离为0

        coins.value.push({ size, speed, angle, distance, alpha: 0.8 }); // 添加 alpha 属性控制透明度
      }
    };

    const animate = (timestamp) => {
      const canvas = coinCanvas.value;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

      const currentTime = timestamp || 0;

      // 生成新金币
      if (currentTime - lastGenerationTime >= coinGenerationInterval) {
        lastGenerationTime = currentTime;
        for (let i = 0; i < 10; i++) {
          createCoin(); // 创建新金币
        }
      }

      coins.value.forEach((coin, index) => {
        // 更新金币的位置
        coin.distance += coin.speed;
        // 计算 x 和 y 坐标
        const x = canvas.width / 2 + coin.distance * Math.cos(coin.angle);
        const y = canvas.height / 2 + coin.distance * Math.sin(coin.angle);

        // 渐渐消失
        if (coin.distance > maxDistance) {
          coin.alpha -= 0.01; // 渐渐降低透明度
          if (coin.alpha <= 0) {
            coins.value.splice(index, 1); // 从数组中移除已经消失的金币
          }
        }

        // 设置透明度
        ctx.globalAlpha = coin.alpha;

        // 绘制金币（正方形）
        ctx.drawImage(
          coinImage,
          x - coin.size / 2,
          y - coin.size / 2,
          coin.size,
          coin.size
        );
      });

      ctx.globalAlpha = 1; // 重置透明度

      // 如果金币数量小于最大数量，继续动画
      if (coins.value.length < maxCoins) {
        animationId = requestAnimationFrame(animate); // 循环动画
      }
    };

    onMounted(() => {
      coinImage.src = coinImageSrc; // 设置 SVG 图像源
      coinImage.onload = () => {
        setupCanvas();
        animate();
      };
    });

    onBeforeUnmount(() => {
      // 清理动画帧
      cancelAnimationFrame(animationId);
    });

    return {
      coinCanvas,
    };
  },
};
</script>

<style scoped>
canvas {
  display: block;
  width: 100%;
  margin: auto;
  height: 200px;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>