/**
 * BFF+ Internationalization (i18n) System
 * Supports: en, tl, es, zh, ko, ja, fr, de
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LangCode = typeof SUPPORTED_LANGUAGES[number]['code'];

type Translations = {
  [key: string]: string;
};

type TranslationMap = {
  [lang in LangCode]?: Translations;
};

const translations: TranslationMap = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.bible': 'Bible',
    'nav.journal': 'Journal',
    'nav.chat': 'Chat',
    'nav.community': 'Community',
    'nav.events': 'Events',
    'nav.groups': 'Groups',
    'nav.sermons': 'Sermons',
    'nav.give': 'Give',
    'nav.prayer': 'Prayer',
    'nav.volunteer': 'Volunteer',
    'nav.profile': 'Profile',
    'nav.search': 'Search',
    'nav.notifications': 'Notifications',
    'nav.admin': 'Admin',
    'nav.readingPlans': 'Reading Plans',
    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.logout': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.faithPoints': 'Faith Points',
    'dashboard.streak': 'Day Streak',
    'dashboard.nextEvent': 'Next Event',
    // Bible
    'bible.selectVersion': 'Select Version',
    'bible.selectBook': 'Select Book',
    'bible.selectChapter': 'Select Chapter',
    'bible.addNote': 'Add Note',
    'bible.addBookmark': 'Add Bookmark',
    'bible.search': 'Search Bible',
    // SOAP
    'soap.scripture': 'Scripture',
    'soap.observation': 'Observation',
    'soap.application': 'Application',
    'soap.prayer': 'Prayer',
    'soap.save': 'Save Entry',
    'soap.private': 'Private',
    'soap.public': 'Public',
    // Prayer
    'prayer.title': 'Prayer Request',
    'prayer.share': 'Share with Community',
    'prayer.prayed': "I've prayed for this",
    'prayer.answered': 'Mark as Answered',
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
  },
  tl: {
    'nav.home': 'Tahanan',
    'nav.bible': 'Bibliya',
    'nav.journal': 'Talaarawan',
    'nav.chat': 'Chat',
    'nav.community': 'Komunidad',
    'nav.events': 'Mga Kaganapan',
    'nav.groups': 'Mga Grupo',
    'nav.sermons': 'Mga Sermon',
    'nav.give': 'Mag-ambag',
    'nav.prayer': 'Panalangin',
    'nav.volunteer': 'Boluntaryo',
    'nav.profile': 'Profile',
    'nav.search': 'Maghanap',
    'nav.notifications': 'Mga Abiso',
    'nav.admin': 'Admin',
    'auth.login': 'Mag-sign In',
    'auth.register': 'Gumawa ng Account',
    'auth.logout': 'Mag-sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Buong Pangalan',
    'dashboard.welcome': 'Maligayang pagbabalik',
    'dashboard.faithPoints': 'Mga Puntos ng Pananampalataya',
    'bible.selectVersion': 'Pumili ng Bersyon',
    'soap.scripture': 'Kasulatan',
    'soap.observation': 'Obserbasyon',
    'soap.application': 'Aplikasyon',
    'soap.prayer': 'Panalangin',
    'prayer.prayed': 'Nanalangin na ako para dito',
    'common.save': 'I-save',
    'common.cancel': 'Ikansela',
    'common.loading': 'Naglo-load...',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.bible': 'Biblia',
    'nav.journal': 'Diario',
    'nav.chat': 'Chat',
    'nav.community': 'Comunidad',
    'nav.events': 'Eventos',
    'nav.groups': 'Grupos',
    'nav.sermons': 'Sermones',
    'nav.give': 'Dar',
    'nav.prayer': 'Oración',
    'nav.volunteer': 'Voluntario',
    'nav.profile': 'Perfil',
    'nav.search': 'Buscar',
    'nav.notifications': 'Notificaciones',
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Crear Cuenta',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'dashboard.welcome': 'Bienvenido de vuelta',
    'soap.scripture': 'Escritura',
    'soap.observation': 'Observación',
    'soap.application': 'Aplicación',
    'soap.prayer': 'Oración',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
  },
  zh: {
    'nav.home': '首页',
    'nav.bible': '圣经',
    'nav.journal': '日记',
    'nav.chat': '聊天',
    'nav.community': '社区',
    'nav.events': '活动',
    'nav.groups': '小组',
    'nav.sermons': '讲道',
    'nav.give': '奉献',
    'nav.prayer': '祷告',
    'nav.profile': '个人资料',
    'auth.login': '登录',
    'auth.register': '注册',
    'dashboard.welcome': '欢迎回来',
    'common.save': '保存',
    'common.cancel': '取消',
  },
  ko: {
    'nav.home': '홈',
    'nav.bible': '성경',
    'nav.chat': '채팅',
    'nav.community': '커뮤니티',
    'nav.events': '이벤트',
    'auth.login': '로그인',
    'auth.register': '회원가입',
    'dashboard.welcome': '다시 오신 것을 환영합니다',
    'common.save': '저장',
    'common.cancel': '취소',
  },
};

let currentLang: LangCode = 'en';

export function setLanguage(lang: LangCode) {
  currentLang = lang;
}

export function t(key: string, lang?: LangCode): string {
  const l = lang || currentLang;
  const langTranslations = translations[l] || {};
  const fallback = translations['en'] || {};
  return langTranslations[key] || fallback[key] || key;
}

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
}

export function getLanguageFlag(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🌐';
}

/**
 * getLang — pure function used by useTranslation hook.
 * Returns translation for `key` in `lang`, falling back to English.
 */
export function getLang(lang: LangCode, key: string): string {
  const langMap = translations[lang] || {};
  const enMap   = translations['en']  || {};
  return langMap[key] ?? enMap[key] ?? key;
}

export default translations;
