import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — Jimmy Potters',
  description: 'Sign in or create your Jimmy Potters account.',
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-brand-bg">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
