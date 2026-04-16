'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import KitChatWidget from '@/components/kit/ChatWidget';
import KitCarousel from '@/components/kit/KitCarousel';
import ClassGallery from '@/components/kit/ClassGallery';
import faqData from '../../../data/kit-faq.json';

export default function KitPageClient() {
  const { lang, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const kitItems = [
    { icon: '🧱', text: t.kit.item1 },
    { icon: '🎨', text: t.kit.item2 },
    { icon: '🔧', text: t.kit.item3 },
    { icon: '🖌️', text: t.kit.item4 },
    { icon: '✨', text: t.kit.item5 },
    { icon: '🏺', text: t.kit.item6 },
    { icon: '🎁', text: t.kit.item7 },
    { icon: '🎬', text: t.kit.item8 },
  ];

  const steps = [
    { number: '01', text: t.kit.step1 },
    { number: '02', text: t.kit.step2 },
    { number: '03', text: t.kit.step3 },
  ];

  return (
    <div>
      {/* Kit FAQ Chat Widget */}
      <KitChatWidget />

      {/* Hero — Split layout: carousel left, text right */}
      <section className="bg-[#3B2314] pt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 md:py-16">
            {/* Carousel on left */}
            <div className="max-w-lg mx-auto lg:mx-0">
              <KitCarousel />
            </div>
            {/* Text content on right */}
            <div className="text-center lg:text-left py-4">
              <span className="inline-block font-body font-bold text-[10px] tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
                {t.kit.dateNightTitle}
              </span>
              <div className="relative inline-block">
                {/* Jok mascot — sits on top of "Pottery", stays sticky on scroll */}
                <div className="absolute -top-[80px] left-[50%] -translate-x-1/2 w-[100px] h-[100px] z-10 pointer-events-none animate-[wave_3s_ease-in-out_infinite]">
                  <iframe
                    src="/jok-viewer.html"
                    width="100"
                    height="100"
                    style={{ border: 'none', background: 'transparent', pointerEvents: 'none' }}
                    title="Jok 3D mascot"
                    loading="lazy"
                  />
                </div>
                <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight">
                  {t.kit.title}
                </h1>
              </div>
              <p className="text-white/70 font-body mt-4 text-lg max-w-xl mx-auto lg:mx-0">
                {t.kit.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center gap-2 bg-[#C9A96E] hover:bg-[#B8923E] text-black font-body font-bold py-5 px-12 rounded-xl transition-all duration-200 text-lg shadow-lg"
                >
                  {t.kit.buyBtn} — {t.kit.price}
                </Link>
              </div>
              {/* Quick highlights */}
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-white/60 text-sm font-body">
                  <span className="text-[#C9A96E]">✓</span> Free Shipping
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm font-body">
                  <span className="text-[#C9A96E]">✓</span> No Kiln Needed
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm font-body">
                  <span className="text-[#C9A96E]">✓</span> For Two People
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm font-body">
                  <span className="text-[#C9A96E]">✓</span> Video Tutorial
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class Gallery — kids in action */}
      <ClassGallery />

      {/* Content */}
      <div className="bg-[#3B2314]">
        <div className="section-container py-16 md:py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">

            {/* LEFT COLUMN — Video Tutorials */}
            <aside className="space-y-3 order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-xl font-heading font-extrabold text-black font-extrabold mb-4">
                {lang === 'es' ? 'Video Tutoriales' : 'Video Tutorials'}
              </h2>
              {[
                { title: lang === 'es' ? 'Cómo Hacer un Jarrón' : 'How to Make a Vase', duration: '4:18', src: '/tutorial-1.mp4' },
                { title: lang === 'es' ? 'Pintar con Esmalte' : 'Painting with Glaze', duration: '8:45', src: null },
                { title: lang === 'es' ? 'Crear Formas de Corazón' : 'Creating Heart Shapes', duration: '10:15', src: null },
                { title: lang === 'es' ? 'Técnicas de Estampado' : 'Stamping Techniques', duration: '7:20', src: null },
                { title: lang === 'es' ? 'Bandeja Decorativa' : 'Decorative Tray', duration: '15:00', src: null },
                { title: lang === 'es' ? 'Arcoíris de Arcilla' : 'Clay Rainbow', duration: '9:50', src: null },
              ].map((video, i) => (
                <div key={i} className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {video.src ? (
                    <div className="relative aspect-video bg-stone-800">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster=""
                      >
                        <source src={video.src} type="video/mp4" />
                      </video>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-stone-800 flex items-center justify-center cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C96B3A" className="w-5 h-5 ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{video.duration}</span>
                      <span className="absolute top-1 left-1 bg-[#C9A96E] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded">{lang === 'es' ? 'Próximo' : 'Soon'}</span>
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-body font-extrabold text-black text-sm leading-tight">{video.title}</h3>
                  </div>
                </div>
              ))}
            </aside>

            {/* RIGHT COLUMN — Main Content */}
            <div className="space-y-8 order-1 lg:order-2">

            {/* Date Night Description */}
            <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                  <span className="text-xl">💑</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-black">
                  {t.kit.dateNightTitle}
                </h2>
              </div>
              <p className="text-black font-body font-bold leading-relaxed text-xl">
                {t.kit.dateNightDesc}
              </p>
              <p className="text-black font-body font-bold text-lg mt-4 italic">
                {t.kit.perfectFor}
              </p>
            </section>

            {/* What's Inside */}
            <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-black">
                  {t.kit.whatsInside}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kitItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <p className="text-black font-body font-bold text-lg leading-relaxed pt-2">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works — 3 steps */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((step) => (
                <div key={step.number} className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                    <span className="font-heading font-bold text-lg text-[#C9A96E]">{step.number}</span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-black mb-2">
                    {t.kit.howItWorks}
                  </h3>
                  <p className="text-black font-body font-bold text-lg leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </section>

            {/* Price & CTA */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
              {/* Kit image strip */}
              <div className="relative h-72 md:h-96 rounded-xl overflow-hidden bg-[#c8bfe0]">
                <Image
                  src="/kit-7.jpeg"
                  alt="Jimmy Potters Home Pottery Kit contents"
                  fill
                  className="object-contain object-center rounded-lg"
                  sizes="(max-width: 768px) 100vw, 896px"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-12 text-center -mt-8 relative">
                <h2 className="font-heading font-bold text-3xl md:text-4xl text-black mb-2">
                  {t.kit.price}
                </h2>
                <p className="text-black font-body font-bold text-lg mb-2">
                  {t.kit.videoAccess}
                </p>
                <p className="text-black font-body font-bold text-xl mb-8">
                  {t.kit.perfectFor}
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#1a1a1a] hover:bg-[#E8D5A3] font-body font-bold font-extrabold py-5 px-12 rounded-xl transition-all duration-200 text-lg"
                  >
                    {t.kit.buyBtn}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 border border-stone-300 text-black hover:border-stone-400 hover:text-black font-body font-bold font-extrabold py-5 px-12 rounded-xl transition-all duration-200 text-lg"
                  >
                    {t.nav.shop}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="mt-16 pb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-black text-center mb-8">
                {lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
              </h2>
              <div className="max-w-2xl mx-auto space-y-3">
                {faqData.map((faq) => (
                  <div key={faq.id} className="border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                    >
                      <span className="font-body font-bold font-extrabold text-black text-lg md:text-xl pr-4">
                        {lang === 'es' ? faq.question_es : faq.question_en}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-5 h-5 text-black flex-shrink-0 transition-transform duration-200 ${openFaq === faq.id ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-5 pb-4 text-black font-body font-bold text-lg leading-relaxed border-t border-stone-100 pt-3">
                        {lang === 'es' ? faq.answer_es : faq.answer_en}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>{/* end RIGHT COLUMN */}
          </div>{/* end 2-column grid */}
        </div>
      </div>
    </div>
  );
}
