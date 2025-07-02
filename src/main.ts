import { createApp } from 'vue'
import './style.scss'
import './animation.scss'
import App from './App.vue'
import i18n from "./locale/index";
import Antd from 'ant-design-vue'
import Vant from 'vant';
import { Lazyload } from 'vant';
import 'vant/lib/index.css';
import router from './router';
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persist'
router.beforeEach((to, from, next) => {
    window.scrollTo(0, 0);
    next();
});
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersist)
app.use(router)
app.use(i18n)
app.use(pinia)
app.use(Antd)
app.use(Vant)
app.use(Lazyload);
// app.use(Dialog);
app.mount('#app')
