// Third part Imports
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Utils imports
import translationsEN from "./locales/en.json";
import translationsHE from "./locales/he.json";

const resources = {
  en: {
    translation: translationsEN,
  },
  he: {
    translation: translationsHE,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "he",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
