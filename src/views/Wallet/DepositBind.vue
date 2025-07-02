<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { rechargeBindApi, rechargedetailsApi } from "@/utils/api";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();

// 表单
const typeVal = ref(route.params.type);
const currency = ref(""); // 交易币种
const card_type = ref(""); // 付款卡类型
const card_number = ref(""); // 付款人卡号
const card_secureid = ref(""); // 卡号安全码
const card_expiry = ref(""); // 卡号有效期
const customer_firstname = ref(""); // 付款人名字
const customer_lastname = ref(""); // 付款人姓氏
const customer_email = ref(""); // 付款人邮箱
const customer_phone = ref(""); // 付款人电话

const currency_list = ref([]); // 币种列表
const currencyShow = ref(false); // 账号类型显示
const currencyValue = ref([]); // 账号类型弹窗选择值
const onConfirm1 = ({ selectedValues, selectedOptions }) => {
    currency.value = selectedOptions[0]?.text;
    currencyValue.value = selectedValues;
    currencyShow.value = false;
};
const account_type_list = ref([]); // 账号类型列表
const accountListShow = ref(false); // 账号类型显示
const accountListValue = ref([]); // 账号类型弹窗选择值
const onConfirm2 = ({ selectedValues, selectedOptions }) => {
    card_type.value = selectedOptions[0]?.text;
    accountListValue.value = selectedValues;
    accountListShow.value = false;
};
const expiryShow = ref(false)
const currentDate = ref(['2024', '01']);
const columnsType = ['year', 'month'];
const currentYear = new Date().getFullYear();
const minDate = ref(new Date(currentYear - 1, 0, 1));
const maxDate = ref(new Date(new Date().setFullYear(currentYear + 10)));
const confirmexpiry = ({ selectedValues, selectedOptions, selectedIndexes }) => {
    console.log(selectedValues);
    card_expiry.value = `${selectedValues[1]}/${selectedValues[0]}`;
    expiryShow.value = false
}
const onSubmit = async (values) => {
    message.loading("Loading...");
    try {
        const res = await rechargeBindApi({
            type: typeVal.value,
            currency: currency.value,
            account_type: card_type.value,
            account: card_number.value,
            secureid: card_secureid.value,
            expiry: card_expiry.value,
            name: customer_firstname.value,
            lastname: customer_lastname.value,
            email: customer_email.value,
            phone: customer_phone.value,
        });
        if (res.success) {
            message.success(res.message);
            setTimeout(() => {
                router.push("/Deposit");
            }, 1000);
        } else {
            message.error(res.message);
        }
    } catch (error) { }
};

const getData = async () => {
    try {
        const res = await rechargedetailsApi({
            type: typeVal.value,
        })
        if (res.success) {
            currency.value = res.data.info.currency
            card_type.value = res.data.info.account_type
            card_number.value = res.data.info.account
            card_secureid.value = res.data.info.secureid
            card_expiry.value = res.data.info.expiry
            customer_firstname.value = res.data.info.name
            customer_lastname.value = res.data.info.lastname
            customer_email.value = res.data.info.email
            customer_phone.value = res.data.info.phone
            currency_list.value = res.data.currency_list
            account_type_list.value = res.data.account_type_list
        }
    } catch (error) {

    }
}
onMounted(() => {
    getData()
})
const goBack = () => {
    router.push("/Deposit");
};
</script>

<template>
    <div class="head">
        <van-icon name="arrow-left" @click="goBack" />
        <p>{{$t("bd0.b0")}}</p>
    </div>
    <div class="page">
        <div class="form">
            <van-form @submit="onSubmit" label-width="8rem">
                <van-cell-group inset>
                    <van-field @click="currencyShow = true" required readonly v-model="currency" name="currency"
                        :label="$t('bd0.b1')" :placeholder="$t('bd0.b2')" :rules="[{ required: true, message: $t('bd0.b2') }]" />
                    <van-field @click="accountListShow = true" required readonly v-model="card_type" name="card_type"
                        :label="$t('bd0.b3')" :placeholder="$t('bd0.b4')" :rules="[{ required: true, message: $t('bd0.b4') }]" />
                    <van-field required v-model="card_number" name="card_number" :label="$t('bd0.b5')" :placeholder="$t('bd0.b6')"
                        :rules="[{ required: true, message: $t('bd0.b6') }]" />
                    <van-field required v-model="card_secureid" name="card_secureid" :label="$t('bd0.b7')"
                        :placeholder="$t('bd0.b8')" :rules="[{ required: true, message: $t('bd0.b8') }]" />
                    <van-field @click="expiryShow = true" required readonly v-model="card_expiry" name="card_expiry"
                        :label="$t('bd0.b9')" :placeholder="$t('bd0.b10')" :rules="[{ required: true, message: $t('bd0.b10') }]" />
                    <van-field required v-model="customer_firstname" name="customer_firstname" :label="$t('bd0.b11')"
                        :placeholder="$t('bd0.b12')" :rules="[{ required: true, message: $t('bd0.b12') }]" />
                    <van-field required v-model="customer_lastname" name="customer_lastname" :label="$t('bd0.b13')"
                        :placeholder="$t('bd0.b14')" :rules="[{ required: true, message: $t('bd0.b14') }]" />
                    <van-field required v-model="customer_email" name="customer_email" :label="$t('bd0.b15')" :placeholder="$t('bd0.b16')"
                        :rules="[{ required: true, message: $t('bd0.b16') }]" />
                    <van-field required v-model="customer_phone" name="customer_phone" :label="$t('bd0.b17')" :placeholder="$t('bd0.b18')"
                        :rules="[{ required: true, message: $t('bd0.b18') }]" />
                </van-cell-group>
                <div style="margin: 16px">
                    <van-button round block class="btn" native-type="submit">
                        {{ $t('hint.h19') }}
                    </van-button>
                </div>
            </van-form>
        </div>
        <van-popup v-model:show="accountListShow" destroy-on-close position="bottom">
            <van-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" :columns="account_type_list" :model-value="accountListValue" @confirm="onConfirm2"
                @cancel="accountListShow = false" />
        </van-popup>
        <van-popup v-model:show="currencyShow" destroy-on-close position="bottom">
            <van-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" :columns="currency_list" :model-value="currencyValue" @confirm="onConfirm1"
                @cancel="currencyShow = false" />
        </van-popup>
        <van-popup v-model:show="expiryShow" destroy-on-close round position="bottom">
            <van-date-picker :confirm-button-text="$t('hint.h16')" :cancel-button-text="$t('hint.h21')" v-model="currentDate" :min-date="minDate" :max-date="maxDate"
                :columns-type="columnsType" @confirm="confirmexpiry" @cancel="expiryShow = false"/>
        </van-popup>

    </div>
</template>

<style lang="scss" scoped>
.head {
    height: 44px;
    background: #0c1026;
    position: fixed;
    z-index: 2;
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

.page {
    padding: 44px 0 10px;

    .form {
        padding: 10px 0 0 0;

        .btn {
            display: flex;
            height: 40px;
            padding: 10px;
            justify-content: center;
            align-items: center;
            gap: 10px;
            border-radius: 5px;
            background: #febe29;
            color: #000;
            font-weight: 600;
            border: none;
        }
    }
}

.van-cell-group,
.van-cell {
    background: #1e293b;
    line-height: 1.3;
    display: block;
}

:deep(.van-field__control),
:deep(.van-field__label) {
    color: #ebf8ff;
}

:deep(.van-cell__title) {
    margin: 0 0 8px 0;
    font-weight: bold;
}

:deep(.van-field__control) {
    &::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
}
</style>