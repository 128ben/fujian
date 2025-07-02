import { createRouter, createWebHistory } from 'vue-router';
import { message } from "ant-design-vue";
import useI18n from "@/locale/index";

const routes = [
    {
        path: '/Invite',
        name: 'Invite',
        component: () => import('@/views/Invite/index.vue')
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home/index.vue')
    },
    {
        path: '/Ranking',
        name: 'Ranking',
        component: () => import('@/views/Ranking/index.vue')
    },
    {
        path: '/Betting',
        name: 'Betting',
        component: () => import('@/views/Betting/index.vue')
    },
    {
        path: '/User',
        name: 'User',
        component: () => import('@/views/User/index.vue')
    },
    {
        path: '/GamePages/:id/:code',
        name: 'Game',
        component: () => import('@/views/GamePages/customGame.vue')
    },
    {
        path: '/PrimitiveGame/:id/:code',
        name: 'PrimitiveGame',
        component: () => import('@/views/GamePages/PrimitiveGame.vue')
    },
    {
        path: '/Deposit',
        name: 'Deposit',
        component: () => import('@/views/Wallet/Deposit.vue')
    },
    {
        path: '/Withdrawal',
        name: 'Withdrawal',
        component: () => import('@/views/Wallet/Withdrawal.vue')
    },
    {
        path: '/Help',
        name: 'Help',
        component: () => import('@/views/Help/index.vue')
    },
    {
        path: '/Bind/:type',
        name: 'Binds',
        component: () => import('@/views/Wallet/Bind.vue')
    },
    {
        path: '/Funds',
        name: 'Funds',
        component: () => import('@/views/Funds/index.vue')
    },
    {
        path: '/Feedback',
        name: 'Feedback',
        component: () => import('@/views/FAQ/index.vue')
    },
    {
        path: '/VIP',
        name: 'VIP',
        component: () => import('@/views/VIP/index.vue')
    },
    {
        path: '/vipDetails',
        name: 'vipDetails',
        component: () => import('@/views/VIP/vipListDetails.vue')
    },
    {
        path: '/edit',
        name: 'Edit',
        component: () => import('@/views/User/Edit.vue')
    },
    {
        path: '/commission',
        name: 'commission',
        component: () => import('@/views/Invite/components/commission.vue')
    },
    {
        path: '/details',
        name: 'details',
        component: () => import('@/views/Invite/components/details.vue')
    },
    {
        path: '/DepositBind/:type',
        name: 'Bind',
        component: () => import('@/views/Wallet/DepositBind.vue')
    },
    {
        path: '/Rebate',
        name: 'Rebate',
        component: () => import('@/views/Invite/components/Rebate.vue')
    },
    {
        path: '/BalanceData',
        name: 'BalanceData',
        component: () => import('@/views/User/components/BalanceData.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 添加路由守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    if (to.path !== '/' && !token) {
        message.warn(useI18n.global.t('hint.h26'))
        next('/'); // 重定向到主页
    } else {
        next(); // 继续路由导航
    }
});

export default router;