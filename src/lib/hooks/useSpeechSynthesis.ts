import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisOptions {
  rate?: number; // 0.85 - 1.0 is gentle for children
  pitch?: number; // 1.0 - 1.1 friendly tone
  onEnd?: () => void;
  onError?: (err: SpeechSynthesisErrorEvent) => void;
}

/**
 * Modern Web Speech Synthesis Hook (Zero npm dependencies)
 * Natural speech playback with Vietnamese voice prioritization and clean lifecycle cleanup.
 */
export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { rate = 0.95, pitch = 1.05, onEnd, onError } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available system voices
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  // Pick best Vietnamese voice (or fallback)
  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    // 1. Exact Vietnamese match
    const viVoice = voices.find(
      (v) => v.lang.toLowerCase() === 'vi-vn' || v.lang.toLowerCase().startsWith('vi')
    );
    if (viVoice) return viVoice;

    // 2. Default voice
    const defaultVoice = voices.find((v) => v.default);
    return defaultVoice || voices[0] || null;
  }, [voices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        setIsPlaying(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
        onError?.(e);
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, getPreferredVoice, onEnd, onError, stop]
  );

  const pause = useCallback(() => {
    if (!isSupported || !isPlaying) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isPlaying]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isSupported,
  };
}
