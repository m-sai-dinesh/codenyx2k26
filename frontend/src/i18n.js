import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationTE from './locales/te/translation.json';

// the translations
const resources = {
  english: {
    translation: translationEN
  },
  hindi: {
    translation: translationHI
  },
  telugu: {
    translation: translationTE
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    // default language is english
    lng: 'english',
    fallbackLng: 'english',
    
    // allow keys to be phrases having :, ., etc.
    nsSeparator: false,
    keySeparator: false,

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
