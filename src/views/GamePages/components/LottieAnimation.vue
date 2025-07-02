<template>
    <transition name="fade">
        <div class="winner-modal">
            <div class="flex">
                <div ref="lottieContainer" :style="containerStyle"></div>
                <div class="textVal" v-if="textShow">
                    <!-- 如果是小数，拆分成整数和小数部分 -->
                    <template v-if="hasDecimal">
                        <van-rolling-text duration="1" ref="rollingTextRefInt" :digit-width="30" :start-num="0"
                            :target-num="integerPart" />
                        <span class="decimal-point">.</span>
                        <van-rolling-text duration="1" ref="rollingTextRefDec" :digit-width="30" :start-num="0"
                            :target-num="decimalPart" />
                    </template>
                    <!-- 如果不是小数，保持原样 -->
                    <van-rolling-text v-else duration="1" ref="rollingTextRef" :digit-width="30" :start-num="0"
                        :target-num="props.amount" />
                </div>
                <van-icon size="24" name="close" @click="close" />
            </div>
        </div>
    </transition>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import lottie from 'lottie-web'
import animationData from "@/assets/lottie/data.json"

const props = defineProps({
    amount: {
        type: String,
        default: 0
    },
})
console.log(props.amount);

const textShow = ref(false)
const rollingTextRef = ref(null);
const rollingTextRefInt = ref(null); // 整数部分 ref
const rollingTextRefDec = ref(null); // 小数部分 ref

// 判断是否是小数
const hasDecimal = computed(() => {
    return props.amount.includes('.');
});

// 获取整数部分
const integerPart = computed(() => {
    return Math.floor(props.amount);
});

// 获取小数部分（去掉小数点后的数字）
const decimalPart = computed(() => {
    const decimalStr = props.amount.toString().split('.')[1] || '0';
    return decimalStr;
});

const start = () => {
    if (hasDecimal.value) {
        rollingTextRefInt.value.start();
        rollingTextRefDec.value.start();
    } else {
        rollingTextRef.value.start();
    }
};

const images = import.meta.glob('@/assets/lottie/images/*', { eager: true })

// 处理动画数据
const processAnimationData = (data) => {
    const processed = JSON.parse(JSON.stringify(data))
    processed.assets.forEach(asset => {
        if (asset.p) {
            const imageName = asset.p.split('/').pop()
            const imagePath = `/src/assets/lottie/images/${imageName}`
            if (images[imagePath]) {
                asset.u = ''
                asset.p = images[imagePath].default
            }
        }
    })
    return processed
}

const lottieContainer = ref(null)
let animation = null

const containerStyle = {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: typeof props.height === 'number' ? `${props.height}px` : props.height
}

const emit = defineEmits(['closeFun'])
const close = () => {
    emit('closeFun');
}

onMounted(() => {
    const animData = processAnimationData(animationData)
    animation = lottie.loadAnimation({
        container: lottieContainer.value,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData: animData
    })
    setTimeout(() => {
        textShow.value = true
        // start()
    }, 1000);
})

onUnmounted(() => {
    if (animation) {
        animation.destroy()
    }
})
</script>

<style lang="scss" scoped>
.winner-modal {
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;

    .flex {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;

        .textVal {
            position: absolute;
            left: 50%;
            top: 47%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;

            .decimal-point {
                color: #fef202;
                font-size: 10vw;
                font-weight: bold;
                text-shadow: -2px 4px 4px rgba(0, 0, 0, 0.5);
            }

            :deep(.van-rolling-text-item) {
                width: 28px;
            }

            .van-rolling-text {
                color: #FFF400;
                font-size: 10vw;
                font-weight: bold;
                text-shadow: 0px 3px 0px #39036D;
            }
        }

        i {
            position: absolute;
            left: 50%;
            top: 86%;
            transform: translate(-50%, -50%);
            z-index: 101;
        }
    }
}
</style>