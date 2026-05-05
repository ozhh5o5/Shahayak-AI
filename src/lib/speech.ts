import type { Language } from '@/lib/enums';

export function getLanguageCode(language: Language): string {
  const map: Record<Language, string> = {
    KANNADA: 'kn-IN',
    HINDI: 'hi-IN',
    ENGLISH: 'en-IN',
    MARATHI: 'mr-IN',
    TELUGU: 'te-IN'
  };
  return map[language];
}

export function speak(text: string, language: Language): Promise<void> {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getLanguageCode(language);
  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    window.speechSynthesis.speak(utterance);
  });
}
