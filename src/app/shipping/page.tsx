import PolicyPage from '@/components/legal/PolicyPage';

export const metadata = {
  title: 'Shipping Policy — Jimmy Potters',
  description: 'Lead times, carrier, insurance, and breakage protection for every Jimmy Potters order.',
};

export default function ShippingPolicy() {
  return (
    <PolicyPage title="Shipping Policy" lastUpdated="2026-04-20">
      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">The short version</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Handling time:</strong> 3-5 business days from order confirmation.</li>
          <li><strong>Carrier:</strong> USPS Priority Mail domestic (3-5 delivery days). FedEx Ground for oversized or heavy orders.</li>
          <li><strong>Insurance:</strong> every order is 100% insured through Shipsurance (underwritten by Voyager / Zurich) at the full declared value.</li>
          <li><strong>Free shipping:</strong> on retail orders over $100 and wholesale orders over $500.</li>
          <li><strong>International:</strong> available by request. Buyer pays duties, taxes, and any customs-related delays.</li>
          <li><strong>Broken on arrival:</strong> photos in 24 hours &rarr; same-day Shipsurance claim &rarr; replacement ships immediately. See Section 6.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">1. Processing &amp; handling time</h2>
        <p>
          Every piece is wheel-thrown, hand-glazed, and inspected before it ships. Standard retail orders leave
          the studio in 3-5 business days. Wholesale orders (10+ units) typically ship in 7 business days from
          payment confirmation. Rush processing is available on request — email{' '}
          <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a> with
          your deadline and we will quote a rush surcharge if we can make it.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">2. Carrier selection</h2>
        <p>
          Our primary carrier is <strong>USPS Priority Mail</strong> for all packages under 10 pounds. Independent
          drop-impact studies have shown that USPS routes sub-5-pound parcels through mixed-mail flow with fewer
          auto-sort conveyor drops than FedEx or UPS, which is meaningful for fragile ceramics. For oversized or
          heavy orders (large vases, bulk wholesale cases), we use FedEx Ground. All shipments include online tracking.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">3. Shipping rates &amp; free-shipping thresholds</h2>
        <p>
          Shipping is calculated at checkout based on package weight, dimensions, and your destination ZIP code.
          Orders that exceed our free-shipping threshold receive free standard shipping automatically:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Retail:</strong> free USPS Priority on orders $100 and above.</li>
          <li><strong>Wholesale:</strong> free USPS Priority on orders $500 and above. Freight quotes available on request for orders over 50 units.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">4. Packaging standard</h2>
        <p>
          Every piece leaves the studio double-boxed to ISTA-3A small-fragile drop specifications. Packing
          includes:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Interior cavity stuffed with loosely crumpled kraft paper so rims are supported under side impact.</li>
          <li>Rim collar — two wraps of bubble wrap, bubbles inward, secured with painter&rsquo;s tape.</li>
          <li>Body wrapped in 3-5 layers of bubble wrap and stretch-film.</li>
          <li>Inner box seated in a 2-inch peanut bed, sealed with H-tape.</li>
          <li>Outer box adds a 3-inch peanut cushion on every face.</li>
          <li>Corner protectors added on packages over 10 inches.</li>
          <li>Outer box labeled &ldquo;Fragile — Handmade Ceramic&rdquo; and &ldquo;This Side Up&rdquo; on two faces.</li>
        </ul>
        <p className="mt-3">
          Keep the original packaging. If you need to return or exchange the piece, re-shipping in its original
          packaging is required to protect it in transit.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">5. Insurance</h2>
        <p>
          Every package is insured at the full declared value of the order via Shipsurance, a third-party
          insurance policy underwritten by Voyager Insurance Company (a subsidiary of Zurich). Insurance is a
          real policy — not a carrier liability cap — and covers loss and damage in transit with a 5-7 business
          day payout process and no &ldquo;insufficient packaging&rdquo; defense for standard fragile goods.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">6. Broken on arrival</h2>
        <p>
          If your piece arrives broken, we make you whole before the claim finishes processing. Here is the
          exact flow:
        </p>
        <ol className="list-decimal pl-6 space-y-2 mt-3">
          <li><strong>Save everything.</strong> Do not discard the outer box, inner box, bubble wrap, or peanuts — we need photographs for the insurance claim.</li>
          <li><strong>Email photos within 24 hours</strong> of delivery to <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>. Include: outer box (all 6 sides), damaged piece still inside its original packing, close-up of the shipping label, close-up of the break.</li>
          <li><strong>We file the Shipsurance claim the same day</strong> and provide you with the claim reference number.</li>
          <li><strong>We ship a replacement piece immediately.</strong> You do not wait for the Shipsurance payout to receive your replacement.</li>
        </ol>
        <p className="mt-3">
          Claims must be filed within 120 calendar days of the ship date — report breaks promptly so we can
          document them while the evidence is fresh.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">7. Lost or stolen packages</h2>
        <p>
          If tracking shows &ldquo;delivered&rdquo; but the package is not at the address, wait 48 hours — USPS
          occasionally marks packages as delivered one day before actual delivery. If it still has not arrived,
          email us and we will file a lost-package claim with Shipsurance and ship a replacement immediately
          once the claim is opened.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">8. International shipping</h2>
        <p>
          International shipping is available on request for most destinations. Email us with your shipping
          address and the pieces you want, and we will quote actual shipping + insurance. International buyers
          are responsible for all duties, taxes, and VAT assessed by the destination country. International
          orders are not eligible for the free-shipping thresholds.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">9. Address accuracy</h2>
        <p>
          We ship to the address provided at checkout. If you entered an incorrect address, email us within 2
          hours of placing the order — once the label is printed and the package is in transit, we cannot
          reroute it. Packages returned to us as undeliverable can be re-shipped at the buyer&rsquo;s expense
          or refunded less the original shipping cost and a 10% restocking fee.
        </p>
      </section>
    </PolicyPage>
  );
}
