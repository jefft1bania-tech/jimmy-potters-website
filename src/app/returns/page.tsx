import PolicyPage from '@/components/legal/PolicyPage';

export const metadata = {
  title: 'Returns & Refunds — Jimmy Potters',
  description: 'Return window, refund process, and breakage protection for Jimmy Potters handmade pottery.',
};

export default function ReturnsPolicy() {
  return (
    <PolicyPage title="Returns & Refunds" lastUpdated="2026-04-20">
      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">The short version</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Return window:</strong> 14 days from delivery.</li>
          <li><strong>Condition:</strong> unused, undamaged, in original packaging.</li>
          <li><strong>Return shipping:</strong> paid by the buyer (we cover outbound).</li>
          <li><strong>Refund timing:</strong> issued within 5 business days of our receiving the returned piece.</li>
          <li><strong>Damaged in transit:</strong> NOT a return — we file a Shipsurance claim and ship a replacement immediately. See Section 4 below.</li>
          <li><strong>Custom &amp; wholesale orders:</strong> final sale unless defective. See Section 5.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">1. Return window</h2>
        <p>
          You have 14 calendar days from the date your order is delivered (per the carrier&rsquo;s tracking record)
          to request a return for any reason. After 14 days, orders are considered final and non-returnable,
          except in the case of a verified manufacturer defect covered under Section 3.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">2. Condition of returned items</h2>
        <p>
          Returned pottery must be in its original, unused condition and shipped back in its original packaging
          (the inner box, the outer box, bubble wrap, rim collar, and peanuts). Because every piece is
          wheel-thrown and hand-glazed, we inspect every return to confirm no chips, hairline cracks, glaze
          abrasion, or surface contamination occurred while the piece was in your possession. Returns showing
          use, damage, or packaging shortfalls may be refused or refunded at a reduced amount at our discretion.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">3. Defects and manufacturer errors</h2>
        <p>
          If the piece you received has a defect that was present before shipping — a hairline crack, unfired
          glaze, a structural flaw, the wrong item, or a material mismatch against the listing — we cover 100%
          of the return and send a replacement at no cost to you. Email <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a>
          within 14 days of delivery with photos of the defect and your order number. We will typically confirm
          the claim within one business day and issue return-shipping instructions.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">4. Breakage in transit (not a return)</h2>
        <p>
          Every order ships via USPS Priority Mail with Shipsurance insurance at the full declared value.
          If your piece arrives broken, this is handled under our breakage protocol — NOT the returns process —
          and you are NOT required to pay for return shipping or a replacement.
        </p>
        <p className="mt-3"><strong>What to do the moment you see a break:</strong></p>
        <ol className="list-decimal pl-6 space-y-2 mt-2">
          <li><strong>Do not discard the box or packing material.</strong> We need evidence to file the claim.</li>
          <li>Within 24 hours, email <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a> photographs of: the outer box (all 6 sides), the damaged piece still inside its packaging, a close-up of the shipping label, and a close-up of the break itself.</li>
          <li>We file the Shipsurance claim the same day.</li>
          <li>We ship a replacement piece to you immediately — you are not required to wait for the Shipsurance payout.</li>
        </ol>
        <p className="mt-3">
          Claims must be filed within 120 days of ship date. We recommend reporting the break within one week of delivery to ensure documentation is clean.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">5. Custom, wholesale, and special-order pieces</h2>
        <p>
          Pieces produced to custom specifications (private-label glazes, custom dimensions, commissioned
          commemorative items, or wholesale-tier volume orders with negotiated pricing) are <strong>final sale</strong>.
          These pieces are made to your spec and cannot be resold through our standard retail channel. Manufacturer
          defects on these orders are still covered under Section 3.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">6. How to start a return</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Email <a href="mailto:jimmy@jimmypotters.com" className="text-stone-900 underline">jimmy@jimmypotters.com</a> with your order number and the reason for the return.</li>
          <li>We reply within one business day with return shipping instructions and a return authorization number.</li>
          <li>Pack the piece in its original packaging (inner box, bubble wrap, rim collar, outer box with peanut cushioning). The original double-boxing is required — we ship every piece tested to ISTA-3A drop standards, and we cannot protect a return that is repackaged loose.</li>
          <li>Ship to the address we provide. We recommend USPS Priority Mail with insurance for the declared value.</li>
          <li>Once received and inspected, we issue the refund to your original payment method within 5 business days. Refunds typically land in your account within 5-10 days after that, depending on your bank.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">7. Refund amount</h2>
        <p>
          You receive a full refund for the pottery price. Outbound shipping (the shipping charge we paid to get
          the piece to you) is non-refundable on retail orders where you change your mind. For orders covered
          under Sections 3 or 4 (defect, wrong item, breakage in transit), we refund 100% of the order value
          including any shipping you paid, or issue a replacement at your choice.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-3">8. Exchanges</h2>
        <p>
          We do not run a formal exchange program. If you want a different piece, request a return under this
          policy and place a new order. This keeps accounting clean and lets your refund process without waiting
          on the new order&rsquo;s fulfillment.
        </p>
      </section>
    </PolicyPage>
  );
}
