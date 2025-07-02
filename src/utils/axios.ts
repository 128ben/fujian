import axios from 'axios';
import { useUserStore } from '@/store/useUserStore'
import { message } from "ant-design-vue";
// 创建axios实例
const service = axios.create({
    // baseURL: 'https://uapi.mgamestar.xyz',
    baseURL: 'https://rbgapi.cg777yakuza.com',
    timeout: 10000,
});

// 请求拦截器
service.interceptors.request.use(
    config => {
        const userStore = useUserStore()
        const token = userStore.token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        config.headers['lang'] = userStore.lang;
        return config;
    },
    error => {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    response => {
        if(response.data.success==0){
            message.error(response.data.message);
        }
        // 对响应数据做些什么
        return response.data;
    },
    error => {
        console.log(error);
        const userStore = useUserStore()
        // 对响应错误做些什么
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 处理未授权的错误
                    userStore.clearUser();
                    message.error('401 Unauthorized, please log in again');
                    break;
                case 404:
                    // 处理资源不存在的错误
                    message.error('404 The requested resource does not exist');
                    break;
                default:
                    // message.error('Request failed, please try again later');
            }
        } else if (error.request) {
            // message.error('The request failed, please check the network connection or refresh the page', 1);
        } else {
            message.error('Request configuration error');
        }
        return Promise.reject(error);
    }
);

export default service;