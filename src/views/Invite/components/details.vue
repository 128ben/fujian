<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { SubordinateApi } from "@/utils/api";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { message } from "ant-design-vue";
const [messageApi, contextHolder] = message.useMessage();
const { t } = useI18n();
const router = useRouter();

//筛选
const searchVal = ref("");
const onClickButton = () => {
    if (searchVal.value == '') return false
    getData();
}
const day_type = ref(1);
const option2 = [
    { text: t("hint.h7"), value: 1 },
    { text: t("hint.h8"), value: 2 },
    { text: t("hint.h9"), value: 3 },
    { text: t("hint.h10"), value: 4 },
    { text: t("hint.h11"), value: 5 },
    { text: t("hint.h12"), value: 6 },
];

const day_typeFun = (e) => {
    list.value = [];
    getData();
};

const list = ref([]);
const getData = async () => {
    messageApi.info("Loading...", 1);
    try {
        const res = await SubordinateApi({
            day_type: day_type.value,
            user_id: searchVal.value
        });
        if (res.success) {
            list.value = res.data.list;
        }
    } catch (error) {
        console.error(error);
    }
};
// 初始加载数据
onMounted(() => {
    getData();
});
const goBack = () => {
    router.go(-1);
};
</script>

<template>
    <context-holder />
    <div class="head">
        <van-icon name="arrow-left" @click="goBack" />
        <p>{{$t("invite0.i44")}}</p>
    </div>
    <div class="pages">
        <div class="tabs">
            <div class="betFilter">
                <van-dropdown-menu>
                    <van-dropdown-item v-model="day_type" :options="option2" @change="day_typeFun" />
                    <van-search v-model="searchVal" show-action :placeholder="$t('invite0.i45')" @search="onSearch">
                        <template #action>
                            <div @click="onClickButton">{{$t("invite0.i46")}}</div>
                        </template>
                    </van-search>
                </van-dropdown-menu>
            </div>
            <van-empty description="No data yet" v-if="list.length < 1" />
            <div class="itemBox" v-else>
                <div class="betList">
                    <div class="flexTitle">
                        <p>ID</p>
                        <p>{{$t("invite0.i47")}}</p>
                        <p>{{$t("invite0.i48")}}</p>
                    </div>
                    <div class="item" :class="index % 2 === 0 ? 'even' : 'odd'" v-for="(item, index) of list"
                        :key="index">
                        <div class="item_row">
                            <p>{{ item.user_id }}</p>
                            <p>{{ item.username }}</p>
                            <p>{{ item.bet_amount }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.pages {
    padding: 44px 0 20px;

    .tabs {
        .betList {
            .flexTitle {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;

                p {
                    flex: 1;
                    text-align: center;
                }
            }

            .item {
                flex: 1;
                display: flex;
                padding: 10px 0;
                justify-content: space-between;
                background: #1e293b;
                margin: 10px 0;
                border-radius: 8px;
                font-size: 14px;

                .item_row {
                    color: rgba(255, 255, 255, 0.6);
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;

                    p {
                        flex: 1;
                    }
                }
            }
        }
    }
}

.item.even {
    animation: slide-left-right 0.6s;
}

.item.odd {
    animation: slide-right-left 0.6s;
}

:deep(.van-cell) {
    background: $bgColor !important;
    color: rgba(255, 255, 255, 0.6);
}

:deep(.van-dropdown-item__option--active) {
    color: #fff;
}

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

:deep(.van-search__content) {
    background: #182234;
    padding: 0;
    border-radius: 8px;
}

.van-search {
    background: #182234;
}

:deep(.van-field__control) {
    color: #fff;
}

:deep(.van-search__action) {
    color: #fff;

    &:active {
        background: none;
    }
}
</style>