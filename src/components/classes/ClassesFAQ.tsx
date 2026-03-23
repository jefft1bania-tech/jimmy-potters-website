'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What age is this for?',
    answer:
      'Our virtual classes are designed for kids ages 7-14. Projects are adaptable for different skill levels within that range — beginners are welcome!',
  },
  {
    question: 'Do I need to buy any supplies?',
    answer:
      'Nope! Everything your child needs is included in the clay kit that ships to your door before the first class. No extra purchases needed.',
  },
  {
    question: 'What if we miss a class?',
    answer:
      'We understand life happens! Contact us and we\'ll provide catch-up instructions so your child doesn\'t fall behind.',
  },
  {
    question: 'How does the sibling discount work?',
    answer:
      'Use code SIBLING15 at checkout for 15% off additional children. Register each child separately with the same promo code.',
  },
  {
    question: 'When does the clay kit ship?',
    answer:
      'Kits ship within 2-3 business days of registration. We recommend registering at least one week before the first class to ensure delivery.',
  },
  {
    question: 'How does the Zoom class work?',
    answer:
      'After payment, you\'ll receive a private Zoom link via email. Each week, your child joins the live video session where our instructor guides them through a new pottery project step by step.',
  },
];

export default function ClassesFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="card-vibrant overflow-hidden">
      <div className="p-8 md:p-10">
        <h2
          id="faq-heading"
          className="font-heading font-black text-2xl md:text-3xl text-brand-text mb-8"
        >
          Frequently Asked Questions
        </h2>

        <div className="space-y-3" role="list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="faq-item rounded-2xl border border-brand-border/50 overflow-hidden transition-all duration-300 hover:border-vibrant-purple/30"
              role="listitem"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:ring-2 focus:ring-vibrant-purple/30 focus:ring-inset rounded-2xl"
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="font-heading font-bold text-brand-text pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`faq-chevron w-5 h-5 text-vibrant-purple flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                id={`faq-answer-${i}`}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
              >
                <p className="px-5 pb-5 text-gray-600 font-body text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
