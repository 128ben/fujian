<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useUserStore } from "@/store/useUserStore";
import { useI18n } from "vue-i18n";
import { MonthlyProfitApi } from "@/utils/api";
import router from "@/router";
import { Locale } from 'vant';
import enUS from 'vant/es/locale/lang/en-US';
import zhCN from 'vant/es/locale/lang/zh-CN';
import ptBR from 'vant/es/locale/lang/pt-BR';
import arSA from 'vant/es/locale/lang/ar-SA';
const userStore = useUserStore();
if (userStore.lang == 'en') {
  Locale.use('en-US', enUS);
} else if (userStore.lang == 'zh') {
  Locale.use('zh-CN', zhCN);
} else if (userStore.lang == 'pt') {
  Locale.use('pt-BR', ptBR);
}else if (userStore.lang == 'ar') {
  Locale.use('ar-SA', arSA);
}
const { t } = useI18n();
const data = ref([])
const getData = async () => {
    try {
        const res = await MonthlyProfitApi({})
        if (res.success) {
            data.value = res.data.list
        }
    } catch (error) {

    }
}
// 初始加载数据
onMounted(() => {
    getData();
});
const today = new Date();
const minDate = new Date(today);
minDate.setDate(today.getDate() - 7);
const maxDate = new Date(today);
maxDate.setDate(today.getDate() - 1)

const formatter = (day: any) => {
    if (day.type != 'disabled') {
        const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
        const matchedData = data.value.find(item => item.date === dateStr);
        if (matchedData) {
            // day.type = "selected"
            day.bottomInfo = matchedData.content;
            if (day.bottomInfo.charAt(0) === '-') {
                day.className = 'activeItemRed'
            } else {
                day.className = 'activeItemGreen'
            }
        }
    }
    return day;
};
const goBack = () => {
    router.push("/User")
}
</script>

<template>
    <div class="head">
        <van-icon name="arrow-left" @click="goBack" />
        <p>{{ $t("user0.u29") }}</p>
    </div>
    <div class="pages">
        <div class="calendar">
            <van-calendar switch-mode="year-month" :title="t('user0.u30')" :poppable="false"
                :show-confirm="false" :formatter="formatter" />
        </div>
    </div>
</template>
<style lang="scss" scoped>
.head {
    width: 100%;
    height: 44px;
    background: #0c1026;
    position: fixed;
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
    padding: 44px 0 0;

    .calendar {
        height: calc(100vh - 44px);
        overflow: hidden;
    }
}

:deep(.activeItemRed) {
    background: #ee0a24;
    border-radius: 4px;
}
:deep(.activeItemGreen) {
    background: #07c160;
    border-radius: 4px;
}
:deep(.van-calendar) {
    background: #000;

}

:deep(.van-calendar__selected-day) {
    background: none;
}
:deep(.van-calendar__header-action),
:deep(.van-calendar__month-title),
:deep(.van-calendar__header-title),
:deep(.van-calendar__header-subtitle),
:deep(.van-calendar__weekday),
:deep(.van-calendar__day) {
    color: #fff;
}

:deep(.van-calendar__day--disabled) {
    color: #c8c9cc;
}
</style>