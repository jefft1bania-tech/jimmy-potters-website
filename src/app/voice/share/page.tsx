import { Suspense } from 'react';
import ShareRecorder from './ShareRecorder';

export const metadata = {
  title: 'Share a Story — Jimmy Potters',
  description: 'Tap, talk, send. Your voice note goes straight to Keyser.',
  robots: { index: false, follow: false },
};

export default function VoiceSharePage() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4rem)',
        background:
          'radial-gradient(ellipse 900px 600px at 50% 0%, rgba(201,169,110,0.18) 0%, transparent 70%), linear-gradient(180deg,#F7F3EE 0%, #EFE8DD 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
      }}
    >
      <Suspense
        fallback={
          <p style={{ fontFamily: 'Cormorant Garamond, serif', color: '#6b4f3a' }}>
            Loading…
          </p>
        }
      >
        <ShareRecorder />
      </Suspense>
    </div>
  );
}
