'use client';

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'ur', name: 'اردو (Urdu)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'ma', name: 'मैथिली (Maithili)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'ar', name: 'العربية (Arabic)' },
];

interface I18nContextProps {
  locale: string;
  setLocale: (lang: string) => void;
  t: (key: string) => string;
  speak: (text: string) => void;
  isLoading: boolean;
  exportMissingKeys?: () => string[];
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

const googleTranslateCache: Record<string, string> = {};

async function googleTranslate(text: string, targetLang: string): Promise<string> {
  // Use a free endpoint for demonstration (note: not for production use)
  // This uses the LibreTranslate API as a free alternative
  const url = 'https://libretranslate.de/translate';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target: targetLang, format: 'text' })
    });
    if (res.ok) {
      const data = await res.json();
      return data.translatedText;
    }
  } catch (e) {
    // ignore
  }
  return text;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [enTranslations, setEnTranslations] = useState<Record<string, string>>({});
  const missingKeysRef = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Initialize locale from localStorage or browser preference
  useEffect(() => {
    const savedLocale = localStorage.getItem('drishiq-locale');
    const browserLocale = navigator.language.split('-')[0];
    const initialLocale = savedLocale || browserLocale || 'en';
    
    // Check if the locale is supported
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === initialLocale);
    const finalLocale = isSupported ? initialLocale : 'en';
    
    setLocale(finalLocale);
    localStorage.setItem('drishiq-locale', finalLocale);
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/locales/${locale}/master.json`);
        let data = {};
        if (res.ok) {
          data = await res.json();
          setTranslations(data);
        } else {
          setTranslations({});
        }
        // Always load English for fallback
        const enRes = await fetch(`/locales/en/master.json`);
        setEnTranslations(enRes.ok ? await enRes.json() : {});
      } catch {
        setTranslations({});
        setEnTranslations({});
      }
      setIsLoading(false);
    };
    loadTranslations();
  }, [locale]);

  function getNested(obj: any, path: string) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  const t = (key: string) => {
    const value = getNested(translations, key);
    const enValue = getNested(enTranslations, key);
    if (value !== undefined && (!enValue || value !== enValue)) {
      return value;
    }
    if (enValue !== undefined) {
      return enValue;
    }
    return '';
  };

  // Optional: export missing keys for developer
  const exportMissingKeys = () => Array.from(missingKeysRef.current);

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = locale;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('drishiq-locale', newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t, speak, isLoading, exportMissingKeys }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};

export { SUPPORTED_LANGUAGES };

