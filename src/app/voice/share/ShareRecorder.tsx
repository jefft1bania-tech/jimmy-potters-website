'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Phase = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

export default function ShareRecorder() {
  const params = useSearchParams();
  const token = (params.get('t') || '').trim();
  const replySubject = (params.get('re') || '').trim();

  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const pickMimeType = (): string | undefined => {
    if (typeof MediaRecorder === 'undefined') return undefined;
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported?.(c)) return c;
    }
    return undefined;
  };

  const startRecording = async () => {
    if (!token) {
      setErrorMsg('Missing or invalid link. Ask Keyser to resend the email.');
      setPhase('error');
      return;
    }
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void uploadAndFinalize(recorder.mimeType || 'audio/webm');
      };
      recorder.start();
      recorderRef.current = recorder;

      startedAtRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);

      setPhase('recording');
    } catch (err) {
      const name = (err as { name?: string })?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setErrorMsg('Microphone permission was denied. Check your browser settings and try again.');
      } else if (name === 'NotFoundError') {
        setErrorMsg('No microphone found on this device.');
      } else {
        setErrorMsg('Could not access the microphone. Try again on a different browser or tap.');
      }
      setPhase('error');
    }
  };

  const stopRecording = () => {
    const r = recorderRef.current;
    if (!r) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      r.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase('uploading');
  };

  const uploadAndFinalize = async (mimeType: string) => {
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size === 0) throw new Error('Recording came back empty');

      const ext = mimeType.includes('mp4')
        ? 'm4a'
        : mimeType.includes('ogg')
        ? 'ogg'
        : 'webm';

      const fd = new FormData();
      fd.append('audio', blob, `voice-note.${ext}`);
      fd.append('token', token);
      fd.append('from', 'jimmy');
      fd.append('duration', String(elapsed));
      if (replySubject) fd.append('subject', replySubject);

      const res = await fetch('/api/voice/share', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Upload failed (${res.status})`);
      }
      setPhase('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setPhase('error');
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const tryAgain = () => {
    setErrorMsg('');
    chunksRef.current = [];
    setElapsed(0);
    setPhase('idle');
  };

  return (
    <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '2.6rem',
          fontWeight: 600,
          color: '#1C1917',
          letterSpacing: '0.5px',
          margin: '0 0 8px 0',
        }}
      >
        Share a Story
      </h1>
      <p style={{ color: '#6b4f3a', fontSize: '1rem', marginBottom: 28 }}>
        Tap, talk, done. Keyser will have the transcript in a minute.
      </p>

      {replySubject ? (
        <p
          style={{
            color: '#7a6a55',
            fontSize: '0.92rem',
            fontStyle: 'italic',
            margin: '0 0 24px 0',
          }}
        >
          Replying to: <span style={{ color: '#1C1917' }}>{replySubject}</span>
        </p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <RecordButton phase={phase} onStart={startRecording} onStop={stopRecording} />

        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '2rem',
            color: phase === 'recording' ? '#92653A' : '#a79a84',
            minHeight: 44,
            letterSpacing: '2px',
          }}
          aria-live="polite"
        >
          {phase === 'recording' ? `${mm}:${ss}` : phase === 'uploading' ? 'Sending…' : ''}
        </div>

        <p style={{ color: '#7a6a55', fontSize: '0.95rem', maxWidth: 420 }}>
          {phase === 'idle' && 'Tap the circle to start. Tap again to stop.'}
          {phase === 'recording' && "Go ahead — I'm listening. Tap again to finish."}
          {phase === 'uploading' && 'Transcribing and emailing Keyser…'}
        </p>

        {phase === 'done' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2D9C7',
              borderRadius: 16,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(146,101,58,0.08)',
              color: '#1C1917',
            }}
          >
            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1.5rem',
                color: '#6b4f3a',
                margin: '0 0 6px 0',
              }}
            >
              Got it.
            </p>
            <p style={{ margin: 0, color: '#555' }}>
              Keyser will have it in a minute. You can close this page.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div
            style={{
              background: '#FFF8F4',
              border: '1px solid #E8C9B4',
              borderRadius: 12,
              padding: '16px 20px',
              color: '#8a3d1a',
              maxWidth: 440,
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>Something went wrong.</p>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.92rem' }}>{errorMsg}</p>
            <button
              onClick={tryAgain}
              style={{
                background: '#92653A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 999,
                padding: '10px 22px',
                fontSize: '0.92rem',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 40, color: '#a79a84', fontSize: '0.78rem' }}>
        Audio is transcribed and discarded. Nothing is stored.
      </p>
    </div>
  );
}

function RecordButton({
  phase,
  onStart,
  onStop,
}: {
  phase: Phase;
  onStart: () => void;
  onStop: () => void;
}) {
  const isRecording = phase === 'recording';
  const isBusy = phase === 'uploading';
  const disabled = isBusy || phase === 'done';

  return (
    <button
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      style={{
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: isRecording
          ? 'radial-gradient(circle at 30% 30%, #C9573C, #8A2F1E)'
          : 'radial-gradient(circle at 30% 30%, #B8844A, #6b4f3a)',
        boxShadow: isRecording
          ? '0 0 0 10px rgba(201,87,60,0.18), 0 14px 36px rgba(138,47,30,0.38)'
          : '0 14px 36px rgba(107,79,58,0.32), 0 0 0 0 rgba(146,101,58,0)',
        color: '#FFFFFF',
        fontSize: '1.05rem',
        fontFamily: '"Cormorant Garamond", serif',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        transform: isRecording ? 'scale(1.04)' : 'scale(1)',
        position: 'relative',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: isRecording ? 'pulse-ring 1.4s ease-out infinite' : 'none',
          boxShadow: isRecording ? '0 0 0 0 rgba(201,87,60,0.6)' : 'none',
        }}
      />
      {isBusy ? 'Sending' : isRecording ? 'Stop' : 'Tap to talk'}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(201, 87, 60, 0.55);
          }
          70% {
            box-shadow: 0 0 0 36px rgba(201, 87, 60, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(201, 87, 60, 0);
          }
        }
      `}</style>
    </button>
  );
}
