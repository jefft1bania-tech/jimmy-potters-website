import PolicyPage from '@/components/legal/PolicyPage';

export const metadata = {
  title: 'Terms of Service — Jimmy Potters',
  description: 'Terms and conditions for use of the Jimmy Potters website and purchase of Jimmy Potters pottery.',
};

export default function TermsOfService() {
  return (
    <PolicyPage title="Terms of Service" lastUpdated="2026-04-20">
      <section>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Jimmy Potters
          website at <a href="https://www.jimmypotters.com" className="text-stone-900 underline">www.jimmypotters.com</a>{' '}
          and any purchase of goods from Jimmy Potters Studio &amp; Workshop LLC (&ldquo;Jimmy Potters,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). By placing an order or creating an account, you agree to these Terms.
          If you do not agree, do not use the site.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">1. Who we are</h2>
        <p>
          Jimmy Potters Studio &amp; Workshop LLC is a Florida limited liability company based in Fort
          Lauderdale, Florida. We design, produce, and sell handmade stoneware pottery directly to retail
          customers and to approved wholesale accounts.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">2. Eligibility &amp; accounts</h2>
        <p>
          You must be at least 18 years old and legally able to enter into a binding contract to purchase from
          us or create an account. You are responsible for keeping your account credentials confidential and
          for all activity that occurs under your account. Notify us promptly at{' '}
          <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>{' '}
          if you suspect unauthorized access.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">3. Products &amp; pricing</h2>
        <p>
          All pottery on the site is wheel-thrown and hand-glazed. Every piece is one of a kind — color,
          glaze pooling, dimensions, and surface texture vary within a reasonable range of the reference
          photograph. We describe each piece as accurately as we can, but minor variation is inherent to
          handmade ceramics and is not considered a defect.
        </p>
        <p className="mt-3">
          Prices are listed in US dollars and may change without notice. We reserve the right to correct
          pricing errors on our site; if you have already placed an order at a clearly erroneous price, we
          will contact you before fulfillment to confirm or cancel.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">4. Orders, payment, and acceptance</h2>
        <p>
          Payment is processed securely by Stripe, Inc. We do not store full card numbers on our servers.
          Placing an order through the site constitutes your offer to purchase; we accept your offer when we
          confirm and ship the order. We reserve the right to decline or cancel any order for reasons
          including product unavailability, suspected fraud, or pricing errors. If we decline an order, we
          will refund any amounts charged to your payment method.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">5. Sales tax</h2>
        <p>
          We collect sales tax on orders shipped to jurisdictions where we are registered to collect. The tax
          is calculated at checkout based on the destination ZIP code and item subtotal. Tax collected is a
          pass-through obligation remitted to the taxing authority and is not retained as revenue.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">6. Shipping, returns, and breakage</h2>
        <p>
          Shipping terms, carrier, insurance, and breakage protocol are governed by our{' '}
          <a href="/shipping" className="text-stone-900 underline">Shipping Policy</a>. Return window, condition
          requirements, and refund timing are governed by our{' '}
          <a href="/returns" className="text-stone-900 underline">Returns &amp; Refunds Policy</a>. Both are
          incorporated into these Terms by reference.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">7. Wholesale accounts</h2>
        <p>
          Wholesale pricing, MOQ, and terms apply only to accounts that have been reviewed and approved by
          Jimmy Potters. Submitting a wholesale application does not grant automatic approval. Approved
          wholesale accounts are subject to additional terms communicated during the onboarding process,
          including net-payment schedules and minimum-order maintenance.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">8. Intellectual property</h2>
        <p>
          All text, photographs, product designs, logos, and original content on the site are owned by Jimmy
          Potters Studio &amp; Workshop LLC or licensed to us. You may not reproduce, distribute, or create
          derivative works from our content without written permission, except for personal, non-commercial
          use such as sharing a product page on social media.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">9. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Use the site in any way that violates applicable law.</li>
          <li>Attempt to interfere with the site&rsquo;s security, availability, or underlying systems.</li>
          <li>Scrape, copy, or re-host our product catalog for commercial use.</li>
          <li>Submit false or fraudulent payment information or chargeback claims.</li>
          <li>Use the site to transmit malware, spam, or harassing content.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">10. Disclaimers</h2>
        <p>
          Except as expressly stated in these Terms or required by applicable law, the site and the products
          are provided &ldquo;as is.&rdquo; We make no warranty that the site will be error-free or
          uninterrupted. Handmade pottery is subject to variation as described in Section 3.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">11. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Jimmy Potters Studio &amp; Workshop LLC and its owners,
          officers, employees, and contractors are not liable for any indirect, incidental, special,
          consequential, or punitive damages arising out of or related to your use of the site or the
          products. Our total liability for any claim arising from an order will not exceed the amount you
          paid for that order.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">12. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Jimmy Potters Studio &amp; Workshop LLC from any claim or
          demand arising from your violation of these Terms or your misuse of the site or products.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">13. Governing law &amp; venue</h2>
        <p>
          These Terms are governed by the laws of the State of Florida without regard to conflict-of-laws
          rules. Any dispute arising out of or related to these Terms or the products will be brought
          exclusively in the state or federal courts located in Broward County, Florida, and you consent to
          that jurisdiction and venue.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">14. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date at the top of this
          page reflects the most recent revision. Continued use of the site after an update constitutes
          acceptance of the revised Terms. For substantive changes, we will notify registered account holders
          by email.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">15. Contact</h2>
        <p>
          Jimmy Potters Studio &amp; Workshop LLC &middot; 700 NW 57th Ct, Suite 1, Fort Lauderdale, Florida 33309 &middot;{' '}
          <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>{' '}
          &middot; <a href="tel:+17038621300" className="text-stone-900 underline">(703) 862-1300</a>.
        </p>
      </section>
    </PolicyPage>
  );
}
