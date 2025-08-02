type SupportedLanguages =
  | 'en' | 'fr' | 'es' | 'pt' | 'it' | 'nl' | 'tr' | 'zh' | 'ja' | 'ko' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'ar' | 'ur';

// Date formatters
const dateFormatters: Record<SupportedLanguages, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en', { dateStyle: 'long' }),
  fr: new Intl.DateTimeFormat('fr', { dateStyle: 'long' }),
  es: new Intl.DateTimeFormat('es', { dateStyle: 'long' }),
  pt: new Intl.DateTimeFormat('pt', { dateStyle: 'long' }),
  it: new Intl.DateTimeFormat('it', { dateStyle: 'long' }),
  nl: new Intl.DateTimeFormat('nl', { dateStyle: 'long' }),
  tr: new Intl.DateTimeFormat('tr', { dateStyle: 'long' }),
  zh: new Intl.DateTimeFormat('zh', { dateStyle: 'long' }),
  ja: new Intl.DateTimeFormat('ja', { dateStyle: 'long' }),
  ko: new Intl.DateTimeFormat('ko', { dateStyle: 'long' }),
  hi: new Intl.DateTimeFormat('hi', { dateStyle: 'long' }),
  bn: new Intl.DateTimeFormat('bn', { dateStyle: 'long' }),
  ta: new Intl.DateTimeFormat('ta', { dateStyle: 'long' }),
  te: new Intl.DateTimeFormat('te', { dateStyle: 'long' }),
  mr: new Intl.DateTimeFormat('mr', { dateStyle: 'long' }),
  ar: new Intl.DateTimeFormat('ar', { dateStyle: 'long' }),
  ur: new Intl.DateTimeFormat('ur', { dateStyle: 'long' }),
};

// Number formatters
const numberFormatters: Record<SupportedLanguages, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en'),
  fr: new Intl.NumberFormat('fr'),
  es: new Intl.NumberFormat('es'),
  pt: new Intl.NumberFormat('pt'),
  it: new Intl.NumberFormat('it'),
  nl: new Intl.NumberFormat('nl'),
  tr: new Intl.NumberFormat('tr'),
  zh: new Intl.NumberFormat('zh'),
  ja: new Intl.NumberFormat('ja'),
  ko: new Intl.NumberFormat('ko'),
  hi: new Intl.NumberFormat('hi'),
  bn: new Intl.NumberFormat('bn'),
  ta: new Intl.NumberFormat('ta'),
  te: new Intl.NumberFormat('te'),
  mr: new Intl.NumberFormat('mr'),
  ar: new Intl.NumberFormat('ar'),
  ur: new Intl.NumberFormat('ur'),
};

// Currency formatters (using USD as default)
const currencyFormatters: Record<SupportedLanguages, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }),
  fr: new Intl.NumberFormat('fr', { style: 'currency', currency: 'USD' }),
  es: new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }),
  pt: new Intl.NumberFormat('pt', { style: 'currency', currency: 'USD' }),
  it: new Intl.NumberFormat('it', { style: 'currency', currency: 'USD' }),
  nl: new Intl.NumberFormat('nl', { style: 'currency', currency: 'USD' }),
  tr: new Intl.NumberFormat('tr', { style: 'currency', currency: 'USD' }),
  zh: new Intl.NumberFormat('zh', { style: 'currency', currency: 'USD' }),
  ja: new Intl.NumberFormat('ja', { style: 'currency', currency: 'USD' }),
  ko: new Intl.NumberFormat('ko', { style: 'currency', currency: 'USD' }),
  hi: new Intl.NumberFormat('hi', { style: 'currency', currency: 'USD' }),
  bn: new Intl.NumberFormat('bn', { style: 'currency', currency: 'USD' }),
  ta: new Intl.NumberFormat('ta', { style: 'currency', currency: 'USD' }),
  te: new Intl.NumberFormat('te', { style: 'currency', currency: 'USD' }),
  mr: new Intl.NumberFormat('mr', { style: 'currency', currency: 'USD' }),
  ar: new Intl.NumberFormat('ar', { style: 'currency', currency: 'USD' }),
  ur: new Intl.NumberFormat('ur', { style: 'currency', currency: 'USD' }),
};

// Time formatters
const timeFormatters: Record<SupportedLanguages, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en', { timeStyle: 'medium' }),
  fr: new Intl.DateTimeFormat('fr', { timeStyle: 'medium' }),
  es: new Intl.DateTimeFormat('es', { timeStyle: 'medium' }),
  pt: new Intl.DateTimeFormat('pt', { timeStyle: 'medium' }),
  it: new Intl.DateTimeFormat('it', { timeStyle: 'medium' }),
  nl: new Intl.DateTimeFormat('nl', { timeStyle: 'medium' }),
  tr: new Intl.DateTimeFormat('tr', { timeStyle: 'medium' }),
  zh: new Intl.DateTimeFormat('zh', { timeStyle: 'medium' }),
  ja: new Intl.DateTimeFormat('ja', { timeStyle: 'medium' }),
  ko: new Intl.DateTimeFormat('ko', { timeStyle: 'medium' }),
  hi: new Intl.DateTimeFormat('hi', { timeStyle: 'medium' }),
  bn: new Intl.DateTimeFormat('bn', { timeStyle: 'medium' }),
  ta: new Intl.DateTimeFormat('ta', { timeStyle: 'medium' }),
  te: new Intl.DateTimeFormat('te', { timeStyle: 'medium' }),
  mr: new Intl.DateTimeFormat('mr', { timeStyle: 'medium' }),
  ar: new Intl.DateTimeFormat('ar', { timeStyle: 'medium' }),
  ur: new Intl.DateTimeFormat('ur', { timeStyle: 'medium' }),
};

// Formatting functions
export function formatDate(date: Date | number, locale: SupportedLanguages): string {
  return dateFormatters[locale].format(date);
}

export function formatNumber(number: number, locale: SupportedLanguages): string {
  return numberFormatters[locale].format(number);
}

export function formatCurrency(amount: number, locale: SupportedLanguages, currency = 'USD'): string {
  // Create a new formatter if currency is different from USD
  if (currency !== 'USD') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }
  return currencyFormatters[locale].format(amount);
}

export function formatTime(date: Date | number, locale: SupportedLanguages): string {
  return timeFormatters[locale].format(date);
}

// Relative time formatter
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeTime(date: Date, locale: SupportedLanguages): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (Math.abs(days) > 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
  } else if (Math.abs(hours) > 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(hours, 'hour');
  } else if (Math.abs(minutes) > 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(minutes, 'minute');
  } else {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(seconds, 'second');
  }
} 