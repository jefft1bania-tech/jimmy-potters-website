import PolicyPage from '@/components/legal/PolicyPage';

export const metadata = {
  title: 'Privacy Policy — Jimmy Potters',
  description: 'How Jimmy Potters collects, uses, and protects your personal data when you shop with us.',
};

export default function PrivacyPolicy() {
  return (
    <PolicyPage title="Privacy Policy" lastUpdated="2026-04-20">
      <section>
        <p>
          Jimmy Potters Studio &amp; Workshop LLC (&ldquo;Jimmy Potters,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us&rdquo;) respects your privacy. This policy explains what personal information we collect,
          how we use it, who we share it with, and what rights you have over it.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">1. Information we collect</h2>
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Account information:</strong> email address, name, password (hashed), and newsletter preferences you set when you create an account.</li>
          <li><strong>Order information:</strong> billing address, shipping address, items ordered, order total, order date.</li>
          <li><strong>Payment information:</strong> payment amount and last-4 digits of your card. Full card numbers, expiration dates, and CVV codes are NOT stored on our servers — they are collected and processed directly by Stripe, Inc.</li>
          <li><strong>Wholesale application information:</strong> company name, resale certificate, company website, tax identifier, and similar business-qualification data submitted on the wholesale-application form.</li>
          <li><strong>Customer-service correspondence:</strong> email messages, photos you send us for returns or breakage claims, and support-chat transcripts.</li>
          <li><strong>Technical information:</strong> IP address, browser type, device type, pages visited, referring URL, timestamp. Collected via standard web-server logs and our analytics provider.</li>
          <li><strong>Cookies:</strong> essential session cookies (keep you signed in), preference cookies (language), and analytics cookies (page-view tracking).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">2. How we use your information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Process and fulfill your orders, including sending order-confirmation and shipping-tracking emails.</li>
          <li>Operate and maintain your account, including signing you in and letting you view order history.</li>
          <li>Provide customer service — return authorizations, breakage-claim processing, dispute resolution.</li>
          <li>Review and approve wholesale applications.</li>
          <li>Detect and prevent fraud (in concert with Stripe&rsquo;s fraud-detection systems).</li>
          <li>Send marketing emails if you have opted in (quarterly wholesale newsletter, product-drop announcements). You can opt out at any time via the unsubscribe link or your account settings.</li>
          <li>Analyze site performance to improve the shopping experience.</li>
          <li>Comply with legal obligations (tax records, subpoenas, regulatory requests).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">3. Who we share your information with</h2>
        <p>
          We do not sell your personal information to anyone. We share it only with service providers who help
          us operate the business, under written agreements that limit their use of the data to the services
          they provide. These include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Stripe, Inc.</strong> — payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">stripe.com/privacy</a>).</li>
          <li><strong>Supabase Inc.</strong> — database hosting for account and order records (<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">supabase.com/privacy</a>).</li>
          <li><strong>Vercel Inc.</strong> — website hosting and edge delivery (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">vercel.com/legal/privacy-policy</a>).</li>
          <li><strong>Resend</strong> — transactional and marketing email delivery (<a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">resend.com/legal/privacy-policy</a>).</li>
          <li><strong>USPS, FedEx, Shipsurance</strong> — carriers and parcel insurance for order fulfillment.</li>
          <li><strong>Law enforcement, courts, or regulators</strong> — only when required by valid legal process.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">4. Data retention</h2>
        <p>
          We retain account and order records for as long as your account is active and for up to seven years
          after closure to comply with tax, accounting, and warranty-period obligations. Customer-service
          correspondence is retained for up to three years. Analytics data is retained in aggregate
          (non-identifying) form indefinitely. You can request earlier deletion under Section 6.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">5. Security</h2>
        <p>
          We protect your information using industry-standard practices, including HTTPS/TLS encryption in
          transit, encrypted password hashing (bcrypt), row-level security on our database, and service-role
          credentials that are never exposed to the browser. No internet transmission or electronic storage is
          100% secure, however, and we cannot guarantee absolute security. Report any suspected security issue
          to <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">6. Your rights</h2>
        <p>Regardless of where you live, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate data.</li>
          <li><strong>Delete</strong> your account and associated data, subject to the retention carve-outs in Section 4 (tax records must be kept).</li>
          <li><strong>Export</strong> your data in a portable format (CSV or JSON on request).</li>
          <li><strong>Opt out</strong> of marketing emails at any time via the unsubscribe link or your account settings.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, email{' '}
          <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>.
          We respond to verified requests within 30 days.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">7. California residents (CCPA / CPRA)</h2>
        <p>
          If you are a California resident, you have additional rights under the California Consumer Privacy
          Act and California Privacy Rights Act, including the right to know what categories of personal
          information we collect and disclose, and the right to opt out of the &ldquo;sale&rdquo; or
          &ldquo;sharing&rdquo; of personal information. We do not sell or share personal information as
          those terms are defined under CCPA/CPRA.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">8. European Economic Area residents (GDPR)</h2>
        <p>
          If you are located in the European Economic Area, United Kingdom, or Switzerland, you have rights
          under the General Data Protection Regulation, including the right to access, rectify, erase, restrict,
          or object to processing of your personal data, and the right to data portability. Our legal bases for
          processing are: (a) contract performance (to fulfill your order), (b) legitimate interest (fraud
          prevention, service improvement), and (c) consent (marketing emails). You have the right to lodge a
          complaint with a supervisory authority.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">9. Children</h2>
        <p>
          Our site is not directed at children under 13 and we do not knowingly collect information from them.
          If you believe a child has provided us information, contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">10. Cookies</h2>
        <p>
          We use a small set of cookies: <strong>session cookies</strong> that keep you signed in and
          remember items in your cart, <strong>preference cookies</strong> that remember your language choice,
          and <strong>analytics cookies</strong> that record aggregate page views. You can disable non-essential
          cookies in your browser settings; if you do, some site features may not work.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">11. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top of this
          page reflects the most recent revision. Material changes will be communicated to registered account
          holders by email.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">12. Contact</h2>
        <p>
          Jimmy Potters Studio &amp; Workshop LLC &middot; Fort Lauderdale, Florida &middot;{' '}
          <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>{' '}
          &middot; <a href="tel:+17038621300" className="text-stone-900 underline">(703) 862-1300</a>.
        </p>
      </section>
    </PolicyPage>
  );
}
