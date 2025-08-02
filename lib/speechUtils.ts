// 🔊 Enhanced Speech Utilities with Locale Awareness

import { useLanguage } from './drishiq-i18n';

// Fallback function for when useLanguage is not available
function getCurrentLocale(): string {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored) return stored;
  }
  // Fallback to browser language or default
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang) return browserLang;
  }
  return 'en';
}

// 🎯 TEXT-TO-SPEECH WITH LOCALE AWARENESS
export function speak(text: string, locale: string = getCurrentLocale()): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Get available voices and select the best match for the locale
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(locale)) || voices[0];
  if (voice) {
    utterance.voice = voice;
  }
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
}

// 🎙️ SPEECH-TO-TEXT WITH LOCALE AWARENESS
export async function listen(locale: string = getCurrentLocale()): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).webkitSpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    
    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };
    
    recognition.onend = () => {
      // Recognition ended
    };
    
    recognition.start();
  });
}

// 🎵 SPEECH WITH CALLBACKS
export function speakWithCallbacks(
  text: string, 
  locale: string = getCurrentLocale(),
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.('Speech synthesis not supported');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Get available voices and select the best match for the locale
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(locale)) || voices[0];
  if (voice) {
    utterance.voice = voice;
  }
  
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => onError?.(event.error);
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
}

// 🎤 CONTINUOUS LISTENING
export function startContinuousListening(
  locale: string = getCurrentLocale(),
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): () => void {
  if (typeof window === 'undefined' || !(window as any).webkitSpeechRecognition) {
    onError?.('Speech recognition not supported in this browser');
    return () => {};
  }
  
  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.lang = locale;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  
  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    if (finalTranscript) {
      onResult(finalTranscript);
    }
  };
  
  recognition.onerror = (event: any) => {
    onError?.(`Speech recognition error: ${event.error}`);
  };
  
  recognition.start();
  
  // Return stop function
  return () => {
    recognition.stop();
  };
}

// 🎯 SPEECH UTILITIES
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

// 🎵 GET AVAILABLE VOICES
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.getVoices();
  }
  return [];
}

// 🎯 GET VOICE FOR LOCALE
export function getVoiceForLocale(locale: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  return voices.find(v => v.lang.startsWith(locale)) || voices[0] || null;
}

// 🎤 SPEECH RECOGNITION STATUS
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(window as any).webkitSpeechRecognition;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
} 