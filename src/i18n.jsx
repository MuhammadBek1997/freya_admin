import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import I18NextHttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

import uzbLang from './lang/uzb.json';
import rusLang from './lang/rus.json';
import engLang from './lang/eng.json';


const language = localStorage.getItem("i18nextLng") || "ru"

i18next
.use(I18NextHttpBackend)
.use(I18nextBrowserLanguageDetector)
.use(initReactI18next)
.init({
    fallbackLng:'ru',
    lng:language,
    debug:true,
    resources:{
        ru:{translation:rusLang},
        uz:{translation:uzbLang},
        en:{translation:engLang}
        
    }
})


export default i18next