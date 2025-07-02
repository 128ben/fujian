import service from "../utils/axios"

// 登录
export function LoginApi(data) {
    return service({
        url: '/api/home/login',
        method: 'post',
        data
    })
}
// 注册
export function RegisterApi(data) {
    return service({
        url: '/api/home/register',
        method: 'post',
        data
    })
}
// 退出登录
export function outLoginApi(data) {
    return service({
        url: '/api/home/logout',
        method: 'post',
        data
    })
}
// 首页
export function HomeApi(data) {
    return service({
        url: '/api/home/gameList',
        method: 'get',
        params: data
    })
}
// 启动游戏
export function startGameApi(data) {
    return service({
        url: '/api/home/game/gameRoom',
        method: 'post',
        data
    })
}
// 游戏下注
export function betOrderApi(data) {
    return service({
        url: '/api/home/game/betOrder',
        method: 'post',
        data
    })
}
// 游戏详情
export function lastOrderInfoApi(data) {
    return service({
        url: '/api/home/game/lastOrderInfo',
        method: 'get',
        params: data
    })
}
// 游戏页下注记录
export function gameOrderLogApi(data) {
    return service({
        url: '/api/home/game/orderLog',
        method: 'get',
        params: data
    })
}
// 游戏页期数记录
export function gamePeriodLogApi(data) {
    return service({
        url: '/api/home/game/periodLog',
        method: 'get',
        params: data
    })
}

// 充值首页
export function rechargeApi(data) {
    return service({
        url: '/api/home/recharge/index',
        method: 'get',
        params: data
    })
}

// 充值账号绑定
export function rechargeBindApi(data) {
    return service({
        url: '/api/home/recharge/bind',
        method: 'post',
        data
    })
}
// 充值详情页
export function rechargedetailsApi(data) {
    return service({
        url: '/api/home/recharge/info',
        method: 'get',
        params: data
    })
}
// 充值提交
export function rechargeSubmitApi(data) {
    return service({
        url: '/api/home/recharge',
        method: 'post',
        data
    })
}

// 提现首页
export function withdrawApi(data) {
    return service({
        url: '/api/home/withdraw/index',
        method: 'get',
        params: data
    })
}

// 提现账号绑定
export function withdrawBindApi(data) {
    return service({
        url: '/api/home/withdraw/bind',
        method: 'post',
        data
    })
}

// 提现提交
export function withdrawSubmitApi(data) {
    return service({
        url: '/api/home/withdraw',
        method: 'post',
        data
    })
}

// 个人信息
export function userApi(data) {
    return service({
        url: '/api/home/userInfo',
        method: 'get',
        params: data
    })
}

// 充值提现历史
export function historyApi(data) {
    return service({
        url: '/api/home/finance/rw/history',
        method: 'get',
        params: data
    })
}

// 投注记录
export function betHistoryApi(data) {
    return service({
        url: '/api/home/finance/bet/history',
        method: 'get',
        params: data
    })
}
// 邀请
export function InviteApi(data) {
    return service({
        url: '/api/home/invite/index',
        method: 'get',
        params: data
    })
}
// 直属返佣
export function directApi(data) {
    return service({
        url: '/api/home/rebate/direct',
        method: 'get',
        params: data
    })
}
// 领取直属返佣
export function directReceiveApi(data) {
    return service({
        url: '/api/home/rebate/directReceive',
        method: 'post',
        data
    })
}
// 团队返佣
export function teamApi(data) {
    return service({
        url: '/api/home/rebate/team',
        method: 'get',
        params: data
    })
}
// 领取团队返佣
export function teamReceiveApi(data) {
    return service({
        url: '/api/home/rebate/teamReceive',
        method: 'post',
        data
    })
}
// 领取宝箱
export function getTreasureApi(data) {
    return service({
        url: '/api/home/treasure',
        method: 'post',
        data
    })
}
// 排行榜
export function rankApi(data) {
    return service({
        url: '/api/home/game/rank',
        method: 'get',
        params: data
    })
}
// 提现充值记录
export function fundsApi(data) {
    return service({
        url: '/api/home/finance/rw/history',
        method: 'get',
        params: data
    })
}

// VIP
export function getVipApi(data) {
    return service({
        url: '/api/home/vip/index',
        method: 'get',
        params: data
    })
}

// 编辑头像
export function getAvatarApi(data) {
    return service({
        url: '/api/home/avatar/list',
        method: 'get',
        params: data
    })
}

// 提交编辑头像
export function submitAvatarApi(data) {
    return service({
        url: '/api/home/avatar/change',
        method: 'post',
        data
    })
}

// 用户余额获取
export function userBalanceApi(data) {
    return service({
        url: '/api/home/userBalance',
        method: 'get',
        params: data
    })
}

// 下属列表
export function SubordinateApi(data) {
    return service({
        url: '/api/home/rebate/direct/user',
        method: 'get',
        params: data
    })
}

// 用户反馈
export function feedbackApi(data) {
    return service({
        url: '/api/home/feedback',
        method: 'post',
        data
    })
}

// 视频回放
export function playbackApi(data) {
    return service({
        url: '/api/home/game/playback',
        method: 'get',
        params: data
    })
}

// 刷新明日佣金
export function refreshCommissionApi(data) {
    return service({
        url: '/api/home/rebate/refresh',
        method: 'get',
        params: data
    })
}

// 每月盈利
export function MonthlyProfitApi(data) {
    return service({
        url: '/api/home/game/profit',
        method: 'get',
        params: data
    })
}

// 忘记密码
export function forgetApi(data) {
    return service({
        url: '/api/home/user/forget',
        method: 'post',
        data
    })
}

// 团队佣金说明
export function getTeamCommissionApi(data) {
    return service({
        url: '/api/home/team/rule',
        method: 'get',
        params: data
    })
}

// 好友列表详情
export function FriendsListItemApi(data) {
    return service({
        url: '/api/home/rebate/direct/team/bet',
        method: 'get',
        params: data
    })
}

// 个人中心获取客服
export function getServiceApi(data) {
    return service({
        url: '/api/home/service',
        method: 'get',
        params: data
    })
}

// 提现绑定信息
export function getwithdrawInfoApi(data) {
    return service({
        url: '/api/home/withdraw/info',
        method: 'get',
        params: data
    })
}

// ping
export function getPingApi(data) {
    return service({
        url: '/api/home/ping',
        method: 'get',
        params: data
    })
}

// 最后一期中奖金额获取接口
export function getLastWinApi(data) {
    return service({
        url: '/api/home/game/lastWinAmount',
        method: 'get',
        params: data
    })
}
