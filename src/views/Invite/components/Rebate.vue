<script lang="ts" setup>
import { onMounted, ref, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getTeamCommissionApi } from "@/utils/api";
import { message } from "ant-design-vue";

const { t } = useI18n();
const router = useRouter();
const emit = defineEmits(["close"]);
const spinning = ref<boolean>(false);
const data = ref([])
const getData = async () => {
    spinning.value = true
    try {
        const res = await getTeamCommissionApi({})
        if (res.success) {
            data.value = res.data.list
            spinning.value = false
        }
    } catch (error) {

    }
}
// 初始加载数据
onMounted(() => {
    getData()
});
// 将索引转换为字母
const idToLetter = (index) => {
    return String.fromCharCode(65 + index);
};
const goBack = () => {
    emit("close");
};
</script>

<template>
    <div class="head">
        <p>{{ $t('invite0.i55') }}</p>
        <van-icon name="cross" @click="goBack" />
    </div>
    <a-spin :spinning="spinning">
        <div class="pages">
            <div class="title">
                <p>{{ $t('invite0.i56') }}</p>
                <p>{{ $t('invite0.i57') }}</p>
                <p>{{ $t('invite0.i58') }}</p>
                <p>{{ $t('invite0.i59') }}</p>
            </div>
            <div class="list">
                <div class="item" v-for="(item, index) of data" :key="index">
                    <p>{{ idToLetter(item.id) }}</p>
                    <p>{{ item.start }}</p>
                    <p>{{ item.end }}</p>
                    <p>{{ item.rebate }}</p>
                </div>
            </div>
            <div class="remark">
                <p>{{ $t('invite0.i60') }}:</p>
                <p>{{ $t('invite0.i61') }}</p>
                <p>{{ $t('invite0.i62') }}</p>
                <p>{{ $t('invite0.i63') }}</p>
            </div>
        </div>
    </a-spin>
</template>
<style lang="scss" scoped>
.pages {
    padding: 44px 10px 20px;

    .title {
        width: 100%;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        font-weight: bold;

        p {
            flex: 1;
            text-align: center;
        }
    }

    .list {
        overflow: auto;
        margin: 0 0 10px 0;

        .item {
            width: 100%;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.5);
            font-size: 13px;

            p {
                flex: 1;
                text-align: center;
            }
        }
    }

    .remark {
        p {
            margin: 6px 0;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);

            &:first-child {
                font-size: 14px;
                color: #fff;
            }
        }
    }
}

.head {
    width: 100%;
    height: 44px;
    background: #0c1026;
    position: fixed;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;

    i {
        position: absolute;
        right: 10px;
    }
}
</style>