import router from '@/router/index';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        invite: localStorage.getItem('invite') || null,
        balance: localStorage.getItem('balance') || null,
        lang: localStorage.getItem('lang') || 'en',
        account: localStorage.getItem('account') || '',
        password: localStorage.getItem('password') || '',
        userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    }),
    actions: {
        setToken(token: string) {
            this.token = token;
            localStorage.setItem('token', token);
        },
        setInvite(invite: string) {
            this.invite = invite;
            localStorage.setItem('invite', invite);
        },
        
        setLang(lang: string) {
            this.lang = lang;
            localStorage.setItem('lang', lang);
        },
        setUserInfo(userInfo: object, val) {
            if (val) {
                this.userInfo[val] = userInfo
            } else {
                this.userInfo = userInfo;
            }
            localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
        },
        setAccount(account: object) {
            this.account = account;
            localStorage.setItem('account', account);
        },
        setPassword(password: object) {
            this.password = password;
            localStorage.setItem('password', password);
        },
        clearUser() {
            this.token = null;
            this.userInfo = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('h5-add-to-home-guide');
            router.push("/")
        },
    },
    persist: true
});