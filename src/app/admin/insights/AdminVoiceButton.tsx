'use client';

import { useEffect, useRef, useState } from 'react';

// Minimal typing for the browser Web Speech API. Only Chrome/Edge/Safari
// implement it reliably; Firefox users will see the button disabled.
type SRInstance = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: SRResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};
type SRResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: { transcript: string };
    0: { transcript: string };
  };
};
type SRCtor = new () => SRInstance;

type Props = {
  onFinal: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
  disabled?: boolean;
};

export default function AdminVoiceButton({ onFinal, onInterim, disabled }: Props) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const recRef = useRef<SRInstance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as typeof window & {
      SpeechRecognition?: SRCtor;
      webkitSpeechRecognition?: SRCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (Ctor) setSupported(true);
  }, []);

  function toggle() {
    if (!supported || disabled) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as typeof window & {
      SpeechRecognition?: SRCtor;
      webkitSpeechRecognition?: SRCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec: SRInstance = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;

    let lastInterim = '';
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText && interimText !== lastInterim) {
        lastInterim = interimText;
        onInterim?.(interimText);
      }
      if (finalText) onFinal(finalText.trim());
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  useEffect(() => {
    return () => {
      recRef.current?.abort();
    };
  }, []);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Web Speech API not available in this browser (Firefox)"
        className="text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border border-stone-800 text-stone-600 cursor-not-allowed"
      >
        Mic N/A
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggle}
      className={`text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        listening
          ? 'border-red-400 bg-red-500/10 text-red-300 animate-pulse'
          : 'border-stone-700 text-stone-400 hover:border-[#C9A96E] hover:text-[#C9A96E]'
      }`}
    >
      {listening ? '● Listening' : '🎤 Voice'}
    </button>
  );
}
