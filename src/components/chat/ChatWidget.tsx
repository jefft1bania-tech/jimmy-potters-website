'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  interactionId?: string | null;
  rated?: boolean;
}

// Generate a persistent session ID per browser tab
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('jp-chat-session');
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('jp-chat-session', id);
  }
  return id;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Jimmy, your pottery assistant! 🏺 Ask me anything about our handmade pottery, after-school programs, virtual clay camp, pricing, or shipping! Sign up for our newsletter at the top of the page for 10% off!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    const userMessage: Message = { role: 'user', content: msgText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!text) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m !== messages[0])
            .map((m) => ({ role: m.role, content: m.content })),
          sessionId: getSessionId(),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          interactionId: data.interactionId,
          rated: false,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again or email jimmy@jimmypotters.com! 🏺",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const rateMessage = async (index: number, rating: 'helpful' | 'not_helpful') => {
    const msg = messages[index];
    if (!msg?.interactionId || msg.rated) return;

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          interactionId: msg.interactionId,
          rating,
        }),
      });

      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, rated: true } : m))
      );
    } catch {
      // Silent fail on rating
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-cta hover:bg-brand-cta-hover text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col" style={{ height: '500px', maxHeight: 'calc(100vh - 140px)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-bg-primary to-brand-bg-secondary p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🏺
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-white text-sm">
                Jimmy Potters Assistant
              </h3>
              <p className="text-white/60 text-xs font-body">
                Ask about pottery, classes & more
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px] font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AI-powered
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-cta text-white rounded-br-md'
                        : 'bg-white text-brand-text shadow-sm border border-brand-border/50 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Feedback buttons for assistant messages */}
                {msg.role === 'assistant' && msg.interactionId && !msg.rated && i > 0 && (
                  <div className="flex justify-start mt-1 ml-1 gap-1">
                    <button
                      onClick={() => rateMessage(i, 'helpful')}
                      className="text-gray-300 hover:text-green-500 transition-colors p-1"
                      aria-label="Helpful answer"
                      title="Helpful"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3.01c0-.463.372-.84.84-.84a.84.84 0 01.84.84V4.5c0 2.197-1.062 4.268-2.828 5.555A7.978 7.978 0 0010.5 12.75H6.633zM6.633 10.5A2.25 2.25 0 004.5 12.75v4.5a2.25 2.25 0 002.133 2.247M6.633 10.5h5.617c2.082 0 3.864 1.58 3.864 3.563 0 .672-.217 1.3-.594 1.812a3.563 3.563 0 01-3.27 2.16H6.633M6.633 19.497A2.25 2.25 0 014.5 17.25v-4.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => rateMessage(i, 'not_helpful')}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      aria-label="Not helpful"
                      title="Not helpful"
                    >
                      <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3.01c0-.463.372-.84.84-.84a.84.84 0 01.84.84V4.5c0 2.197-1.062 4.268-2.828 5.555A7.978 7.978 0 0010.5 12.75H6.633zM6.633 10.5A2.25 2.25 0 004.5 12.75v4.5a2.25 2.25 0 002.133 2.247M6.633 10.5h5.617c2.082 0 3.864 1.58 3.864 3.563 0 .672-.217 1.3-.594 1.812a3.563 3.563 0 01-3.27 2.16H6.633M6.633 19.497A2.25 2.25 0 014.5 17.25v-4.5" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Rated confirmation */}
                {msg.role === 'assistant' && msg.rated && (
                  <div className="flex justify-start mt-1 ml-1">
                    <span className="text-[10px] text-gray-400 font-body">Thanks for the feedback!</span>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-brand-text shadow-sm border border-brand-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-brand-border/30 flex gap-2 overflow-x-auto">
              {[
                'Class pricing?',
                'What ages?',
                "What's in the kit?",
                'Show me planters',
                'Shipping info',
                'Newsletter discount?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs font-heading font-bold text-brand-cta bg-brand-cta/5 hover:bg-brand-cta/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-brand-border/30">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about pottery, classes, pricing..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-brand-border/50 focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20 outline-none text-sm font-body text-brand-text placeholder:text-gray-400 transition-all"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
