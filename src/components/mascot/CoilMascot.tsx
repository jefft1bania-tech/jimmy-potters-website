'use client';

import { useState } from 'react';

/**
 * Jok Mascot — 3D Animated Mixamo Kid
 *
 * No box, no container — the kid floats transparently on the page.
 * Positioned next to the "One-of-a-Kind Pottery" hero text.
 */

export default function CoilMascot() {
  const [showBubble, setShowBubble] = useState(false);

  return (
    <div
      className="fixed top-[18%] left-[22%] z-40 flex flex-row items-start gap-3"
      style={{ pointerEvents: 'auto' }}
    >
      {/* 3D Character — no box, fully transparent */}
      <button
        onClick={() => setShowBubble(!showBubble)}
        className="cursor-pointer focus:outline-none group"
        aria-label="Meet Jok, our pottery kid mascot"
        title="Click to say hi!"
      >
        <iframe
          src="/jok-viewer.html"
          width="200"
          height="250"
          style={{
            border: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            display: 'block',
          }}
          title="Jok 3D mascot"
          loading="lazy"
        />
      </button>

      {/* Speech Bubble (appears to the right of the kid) */}
      {showBubble && (
        <div
          className="bg-white rounded-2xl shadow-xl p-4 max-w-[220px] border-2 border-[#C9A96E] relative mt-12"
          role="tooltip"
          style={{ animation: 'popIn 0.3s ease-out' }}
        >
          <button
            onClick={() => setShowBubble(false)}
            className="absolute top-1 right-2 text-stone-400 hover:text-stone-600 text-lg"
            aria-label="Close"
          >
            &times;
          </button>
          <p className="text-sm text-stone-700 font-medium leading-snug">
            Hi there! I&apos;m <span className="text-[#C9A96E] font-bold">Jok</span>! 🎨
          </p>
          <p className="text-xs text-stone-500 mt-1 leading-snug">
            Want to make cool pottery? Ask about our after-school classes for kids K-5th grade!
          </p>
          <div className="mt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const chatBtn = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                if (chatBtn) chatBtn.click();
                setShowBubble(false);
              }}
              className="text-xs bg-[#C9A96E] text-white px-3 py-1.5 rounded-full hover:bg-[#B89555] transition-colors inline-block font-medium"
            >
              Ask about classes!
            </a>
          </div>
          <div className="absolute top-10 -left-2 w-4 h-4 bg-white border-l-2 border-b-2 border-[#C9A96E] transform rotate-45" />
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
