import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password — Jimmy Potters',
  description: 'Reset your Jimmy Potters account password.',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-brand-bg">
      <ForgotPasswordForm />
    </div>
  );
}
