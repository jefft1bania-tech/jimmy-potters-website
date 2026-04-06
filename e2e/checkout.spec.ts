import { test, expect, type Page, type FrameLocator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Stripe E2E Checkout — Jimmy Potters
// ---------------------------------------------------------------------------
// Prerequisites:
//   1. Copy .env.example → .env.local and fill in real Stripe **test** keys
//   2. npm install && npx playwright install chromium
//   3. npx playwright test
//
// Stripe test card numbers (official):
//   Success:        4242 4242 4242 4242
//   Decline:        4000 0000 0000 0002
//   3D Secure:      4000 0025 0000 3155
//   Insufficient:   4000 0000 0000 9995
// ---------------------------------------------------------------------------

// Validate env vars at import time so failures are obvious
test.beforeAll(() => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local — ' +
        'must start with pk_test_. Never use live keys in tests.',
    );
  }
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    throw new Error(
      'Missing or invalid STRIPE_SECRET_KEY in .env.local — ' +
        'must start with sk_test_. Never use live keys in tests.',
    );
  }
});

// Test data ----------------------------------------------------------------

const TEST_PRODUCT_SLUG = 'teal-hanging-planter-pothos';
const TEST_PRODUCT_NAME = 'Teal Hanging Planter with Ring';

const DUMMY_CUSTOMER = {
  name: 'E2E Test Customer',
  email: 'e2e-test@jimmypotters.com',
  shipName: 'E2E Test Recipient',
  address: '100 Test Boulevard',
  addressLine2: 'Suite 42',
  city: 'Fort Lauderdale',
  state: 'FL',
  zip: '33301',
};

const STRIPE_TEST_CARD = {
  number: '4242424242424242',
  expiry: '12 / 30', // Stripe auto-formats with spaces + slash
  cvc: '123',
};

// Helpers ------------------------------------------------------------------

/**
 * Fill a field inside a Stripe iframe.
 *
 * Stripe renders each input (card number, expiry, CVC) inside its own
 * nested iframe. The PaymentElement with layout:"tabs" wraps them in a
 * single parent iframe, which in turn contains sub-iframes per field.
 * We locate the correct sub-iframe by a partial name match, then type
 * into the <input> inside it.
 */
async function fillStripeField(
  page: Page,
  iframeName: string,
  value: string,
) {
  // Stripe iframes use names like "__privateStripeFrame<N>"
  // The PaymentElement parent iframe contains the actual input frames
  const stripeFrame = page
    .frameLocator(`iframe[name*="${iframeName}"]`)
    .first();

  const input = stripeFrame.locator('input').first();
  await input.waitFor({ state: 'visible', timeout: 20_000 });
  await input.fill(value);
}

/**
 * Locate and fill all fields in the Stripe PaymentElement.
 *
 * The PaymentElement (layout: 'tabs') renders as a parent iframe that
 * contains child iframes for each field. We locate the parent first,
 * then interact with inputs inside it.
 */
async function fillStripePaymentElement(page: Page) {
  // Wait for the Stripe PaymentElement to mount
  // The parent iframe name varies, but always contains "__privateStripeFrame"
  const parentFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();

  // Wait for the card number input to appear inside the Stripe frame
  // In the "tabs" layout, card is the default tab and the number field loads first
  await parentFrame.locator('[name="number"], [placeholder*="number" i], input').first()
    .waitFor({ state: 'visible', timeout: 30_000 });

  // The PaymentElement in "tabs" layout may render all fields in one iframe
  // or nest them. Try the single-iframe approach first.
  const numberInput = parentFrame.locator('[name="number"]');

  if (await numberInput.count() > 0) {
    // Single iframe — all fields together (newer Stripe versions)
    await numberInput.fill(STRIPE_TEST_CARD.number);
    await parentFrame.locator('[name="expiry"]').fill(STRIPE_TEST_CARD.expiry);
    await parentFrame.locator('[name="cvc"]').fill(STRIPE_TEST_CARD.cvc);
  } else {
    // Nested iframes — each field in its own sub-iframe
    // Fall back to typing into generic inputs
    const inputs = parentFrame.locator('input');
    const count = await inputs.count();

    if (count >= 3) {
      // Card number, expiry, CVC in order
      await inputs.nth(0).fill(STRIPE_TEST_CARD.number);
      await inputs.nth(1).fill(STRIPE_TEST_CARD.expiry);
      await inputs.nth(2).fill(STRIPE_TEST_CARD.cvc);
    } else {
      // Deepest fallback — locate each Stripe sub-frame individually
      const allFrames = page.frames();
      const stripeFrames = allFrames.filter((f) =>
        f.name().includes('__privateStripeFrame'),
      );

      for (const frame of stripeFrames) {
        const input = frame.locator('input[name="cardnumber"], input[name="number"]');
        if ((await input.count()) > 0) {
          await input.fill(STRIPE_TEST_CARD.number);
          continue;
        }
        const expInput = frame.locator('input[name="exp-date"], input[name="expiry"]');
        if ((await expInput.count()) > 0) {
          await expInput.fill(STRIPE_TEST_CARD.expiry);
          continue;
        }
        const cvcInput = frame.locator('input[name="cvc"]');
        if ((await cvcInput.count()) > 0) {
          await cvcInput.fill(STRIPE_TEST_CARD.cvc);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Stripe Checkout E2E', () => {
  test('complete guest checkout with test card', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1 — Navigate to product page and add to cart
    // -----------------------------------------------------------------------
    await test.step('Add product to cart', async () => {
      await page.goto(`/shop/${TEST_PRODUCT_SLUG}`);
      await expect(page.locator('h1')).toContainText(TEST_PRODUCT_NAME);

      const addBtn = page.getByRole('button', { name: /add to cart/i });
      await expect(addBtn).toBeVisible();
      await addBtn.click();

      // Button should change to "In Your Cart" after adding
      await expect(
        page.getByRole('button', { name: /in your cart/i }),
      ).toBeVisible({ timeout: 5_000 });
    });

    // -----------------------------------------------------------------------
    // Step 2 — Go to cart and proceed to checkout
    // -----------------------------------------------------------------------
    await test.step('Proceed from cart to checkout', async () => {
      // Navigate to cart (via nav link or direct URL)
      await page.goto('/cart');
      await expect(page.locator('h1')).toContainText('Cart');

      // Verify our product is in the cart
      await expect(page.getByText(TEST_PRODUCT_NAME)).toBeVisible();

      // Click "Proceed to Checkout"
      const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
      await expect(checkoutLink).toBeVisible();
      await checkoutLink.click();

      await page.waitForURL('/checkout');
      await expect(page.locator('h1')).toContainText('Checkout');
    });

    // -----------------------------------------------------------------------
    // Step 3 — Select Guest Checkout
    // -----------------------------------------------------------------------
    await test.step('Select Guest Checkout', async () => {
      const guestBtn = page.getByRole('button', { name: /guest checkout/i });
      await expect(guestBtn).toBeVisible();
      await guestBtn.click();

      // After clicking, the contact info form (Step 2) should appear
      await expect(page.getByText('Step 2: Your Information')).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // Step 4 — Fill contact information
    // -----------------------------------------------------------------------
    await test.step('Fill contact information', async () => {
      await page.getByPlaceholder('Jane Smith').first().fill(DUMMY_CUSTOMER.name);
      await page.getByPlaceholder('jane@example.com').fill(DUMMY_CUSTOMER.email);
    });

    // -----------------------------------------------------------------------
    // Step 5 — Fill shipping address and select ground shipping
    // -----------------------------------------------------------------------
    await test.step('Fill shipping address and select shipping', async () => {
      // Shipping address fields (Step 3)
      await expect(page.getByText('Step 3: Shipping Address')).toBeVisible();

      // Recipient name — second "Jane Smith" placeholder on the page
      const recipientFields = page.getByPlaceholder('Jane Smith');
      await recipientFields.nth(1).fill(DUMMY_CUSTOMER.shipName);

      await page.getByPlaceholder('123 Main St').fill(DUMMY_CUSTOMER.address);
      await page.getByPlaceholder('Apt 4B (optional)').fill(DUMMY_CUSTOMER.addressLine2);
      await page.getByPlaceholder('Fort Lauderdale').fill(DUMMY_CUSTOMER.city);

      // Select state from dropdown
      const stateSelect = page.locator('select').last();
      await stateSelect.selectOption(DUMMY_CUSTOMER.state);

      await page.getByPlaceholder('22030').fill(DUMMY_CUSTOMER.zip);

      // After selecting state, shipping tiers appear — FedEx Ground is default
      await expect(page.getByText('FedEx Ground')).toBeVisible();
      // Ground is pre-selected by default (selectedTier starts as 'ground')
      const groundRadio = page.locator('input[type="radio"][value="ground"]');
      await expect(groundRadio).toBeChecked();
    });

    // -----------------------------------------------------------------------
    // Step 6 — Continue to Payment (creates PaymentIntent)
    // -----------------------------------------------------------------------
    await test.step('Continue to payment', async () => {
      const continueBtn = page.getByRole('button', { name: /continue to payment/i });
      await expect(continueBtn).toBeEnabled();
      await continueBtn.click();

      // Wait for Step 4: Payment to appear (PaymentIntent created, Stripe mounts)
      await expect(page.getByText('Step 4: Payment')).toBeVisible({
        timeout: 30_000,
      });
    });

    // -----------------------------------------------------------------------
    // Step 7 — Fill Stripe PaymentElement with test card
    // -----------------------------------------------------------------------
    await test.step('Fill Stripe payment form', async () => {
      // Give Stripe a moment to fully mount its iframes
      await page.waitForTimeout(3_000);

      await fillStripePaymentElement(page);

      // Small delay for Stripe to validate the card
      await page.waitForTimeout(1_000);
    });

    // -----------------------------------------------------------------------
    // Step 8 — Submit payment and verify success
    // -----------------------------------------------------------------------
    await test.step('Submit payment and verify order confirmation', async () => {
      const payBtn = page.getByRole('button', { name: /pay now/i });
      await expect(payBtn).toBeEnabled({ timeout: 10_000 });
      await payBtn.click();

      // Button should show processing state
      await expect(
        page.getByText(/processing payment/i),
      ).toBeVisible({ timeout: 5_000 });

      // Wait for redirect to success page — Stripe can take 10-20s
      await page.waitForURL(/\/success\?order_id=.*&type=product/, {
        timeout: 60_000,
      });

      // Verify order confirmation UI
      await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible();
      await expect(
        page.getByText(/your order is confirmed/i),
      ).toBeVisible();
      await expect(
        page.getByText(/3–5 business days/i),
      ).toBeVisible();

      // "Continue Shopping" link should be present
      const continueLink = page.getByRole('link', { name: /continue shopping/i });
      await expect(continueLink).toBeVisible();
      await expect(continueLink).toHaveAttribute('href', '/shop');

      // URL should contain a valid order_id
      const url = new URL(page.url());
      expect(url.searchParams.get('order_id')).toBeTruthy();
      expect(url.searchParams.get('type')).toBe('product');
    });
  });
});
