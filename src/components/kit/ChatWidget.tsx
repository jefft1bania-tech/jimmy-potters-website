'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import faqData from '../../../data/kit-faq.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FaqEntry {
  id: number;
  question_en: string;
  question_es: string;
  answer_en: string;
  answer_es: string;
  category: string;
}

/**
 * Simple keyword-based FAQ matcher.
 * Tokenizes the user query and each FAQ question, then scores by
 * the number of overlapping non-trivial words. Returns the best
 * match if it exceeds a minimum threshold, otherwise null.
 */
function findBestFaq(query: string, lang: 'en' | 'es'): FaqEntry | null {
  const stopWords = new Set([
    // English
    'the', 'a', 'an', 'is', 'it', 'do', 'does', 'i', 'my', 'me', 'we',
    'you', 'your', 'this', 'that', 'in', 'on', 'at', 'to', 'for', 'of',
    'and', 'or', 'but', 'not', 'with', 'can', 'will', 'be', 'are', 'was',
    'how', 'what', 'when', 'where', 'why', 'who', 'which', 'there', 'have',
    'has', 'had', 'if', 'so', 'as', 'about', 'just', 'any',
    // Spanish
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'es', 'y',
    'o', 'que', 'por', 'para', 'con', 'se', 'su', 'al', 'lo', 'como',
    'mi', 'me', 'te', 'nos', 'no', 'si', 'hay', 'este', 'esta',
  ]);

  function tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\u00e0-\u00ff\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w))
    );
  }

  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return null;

  let bestScore = 0;
  let bestFaq: FaqEntry | null = null;

  for (const faq of faqData as FaqEntry[]) {
    // Match against both languages for robustness
    const qEn = tokenize(faq.question_en);
    const qEs = tokenize(faq.question_es);
    // Also tokenize the answer to catch keyword hits
    const aKey = lang === 'es' ? tokenize(faq.answer_es) : tokenize(faq.answer_en);

    let matches = 0;
    for (const token of queryTokens) {
      if (qEn.has(token) || qEs.has(token)) {
        matches += 2; // question match weighted higher
      } else if (aKey.has(token)) {
        matches += 1;
      }
    }

    // Normalize by query size so short queries can still match
    const score = matches / queryTokens.size;

    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  // Require at least a score of 1.0 (at least one strong keyword hit)
  return bestScore >= 1.0 ? bestFaq : null;
}

const GREETING = {
  en: "Hi! I'm the Kit Assistant for Jimmy Potters. Ask me anything about the Home Pottery Kit -- what's included, shipping, pricing, or how it works!",
  es: "Hola! Soy el Asistente del Kit de Jimmy Potters. Preguntame lo que quieras sobre el Kit de Ceramica en Casa -- que incluye, envio, precio o como funciona!",
};

const NO_MATCH = {
  en: "I don't have an answer for that yet, but you can email us at jimmy@jimmypotters.com and we'll be happy to help!",
  es: "Aun no tengo una respuesta para eso, pero puedes escribirnos a jimmy@jimmypotters.com y con gusto te ayudamos!",
};

const QUICK_ACTIONS = {
  en: [
    "What's in the kit?",
    'Do I need experience?',
    'How long does it take?',
    'Shipping info',
    'Is it a good gift?',
    'Can kids use it?',
  ],
  es: [
    'Que incluye el kit?',
    'Necesito experiencia?',
    'Cuanto tiempo toma?',
    'Info de envio',
    'Es un buen regalo?',
    'Pueden usarlo ninos?',
  ],
};

export default function KitChatWidget() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING[lang] },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update greeting when language changes
  useEffect(() => {
    setMessages((prev) => [
      { role: 'assistant', content: GREETING[lang] },
      ...prev.slice(1),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    const userMsg: Message = { role: 'user', content: msgText };

    // FAQ lookup
    const faq = findBestFaq(msgText, lang);
    const reply: Message = {
      role: 'assistant',
      content: faq
        ? lang === 'es'
          ? faq.answer_es
          : faq.answer_en
        : NO_MATCH[lang],
    };

    setMessages((prev) => [...prev, userMsg, reply]);
    if (!text) setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
        style={{ backgroundColor: '#C9A96E' }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#3B2314"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="#3B2314"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            height: '480px',
            maxHeight: 'calc(100vh - 140px)',
            border: '1px solid #C9A96E',
            backgroundColor: '#FFF9F0',
          }}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #3B2314 0%, #5C3A1E 100%)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: 'rgba(201,169,110,0.25)' }}
            >
              <span role="img" aria-label="pottery">
                🏺
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">
                {lang === 'es' ? 'Asistente del Kit' : 'Kit Assistant'}
              </h3>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {lang === 'es'
                  ? 'Pregunta sobre el kit de ceramica'
                  : 'Ask about the pottery kit'}
              </p>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
              style={{
                backgroundColor: 'rgba(201,169,110,0.2)',
                color: '#C9A96E',
              }}
            >
              FAQ
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: '#C9A96E', color: '#3B2314' }
                      : {
                          backgroundColor: '#FFFFFF',
                          color: '#3B2314',
                          border: '1px solid #E8D5B0',
                          boxShadow: '0 1px 2px rgba(59,35,20,0.06)',
                        }
                  }
                >
                  <span className="block text-[10px] font-bold mb-1 opacity-60">
                    {msg.role === 'user'
                      ? lang === 'es'
                        ? 'Tu'
                        : 'You'
                      : lang === 'es'
                        ? 'Asistente del Kit'
                        : 'Kit Assistant'}
                  </span>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (only shown at start) */}
          {messages.length <= 1 && (
            <div
              className="px-4 py-2 flex gap-2 overflow-x-auto"
              style={{ borderTop: '1px solid #E8D5B0' }}
            >
              {QUICK_ACTIONS[lang].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    color: '#8B6914',
                    backgroundColor: 'rgba(201,169,110,0.12)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.25)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.12)')
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3" style={{ borderTop: '1px solid #E8D5B0', backgroundColor: '#FFFFFF' }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  lang === 'es'
                    ? 'Pregunta sobre el kit...'
                    : 'Ask about the kit...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #E8D5B0',
                  color: '#3B2314',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E8D5B0')}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C9A96E' }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled)
                    e.currentTarget.style.backgroundColor = '#B8923E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C9A96E';
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#3B2314"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
