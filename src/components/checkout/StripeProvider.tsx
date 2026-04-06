'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeProvider({
  clientSecret,
  children,
}: {
  clientSecret: string;
  children: ReactNode;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#C9A96E',
            colorBackground: '#1a1a1a',
            colorText: '#e7e5e4',
            colorDanger: '#ef4444',
            fontFamily: 'DM Sans, sans-serif',
            borderRadius: '12px',
          },
          rules: {
            '.Input': {
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'none',
            },
            '.Input:focus': {
              border: '1px solid #C9A96E',
              boxShadow: '0 0 0 2px rgba(201,169,110,0.2)',
            },
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
