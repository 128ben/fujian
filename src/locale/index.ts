import { createI18n } from "vue-i18n";

import en from './en.ts'
import zh from './zh.ts'
import pt from './pt.ts'
import ar from './ar.ts'
import es from './es.ts'

const i18n = createI18n({
    locale: localStorage.getItem("lang") || 'zh',
    legacy: false,
    messages: {
        en: en,
        zh: zh,
        pt: pt,
        ar: ar,
        es: es,
    }
})
export default i18n