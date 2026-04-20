import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password — Jimmy Potters',
  description: 'Set a new password for your Jimmy Potters account.',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-brand-bg">
      <ResetPasswordForm />
    </div>
  );
}
