import { describe, it, expect } from 'vitest';
import {
  classifyBulkFlag,
  classifyShipByWindow,
  selectOrdersToNotify,
  renderBulkOrderEmail,
} from '../src/lib/notifications';
import { computeDuePosts, type RecurringExpense } from '../src/lib/expenses/recurring';

describe('classifyBulkFlag', () => {
  it.each([
    [1, 'normal'],
    [9, 'normal'],
    [10, 'heads_up'],
    [24, 'heads_up'],
    [25, 'critical'],
    [49, 'critical'],
    [50, 'urgent'],
    [200, 'urgent'],
  ])('classifies %i pots as %s', (qty, expected) => {
    expect(classifyBulkFlag(qty)).toBe(expected);
  });
});

describe('classifyShipByWindow', () => {
  const today = new Date('2026-04-20T12:00:00Z');

  it('returns null for no ship date', () => {
    expect(classifyShipByWindow(null, today)).toBeNull();
  });
  it('returns overdue for a past date', () => {
    expect(classifyShipByWindow('2026-04-19', today)).toBe('overdue');
  });
  it('returns ship_by_3d for 3 days out', () => {
    expect(classifyShipByWindow('2026-04-23', today)).toBe('ship_by_3d');
  });
  it('returns ship_by_7d for 6 days out', () => {
    expect(classifyShipByWindow('2026-04-26', today)).toBe('ship_by_7d');
  });
  it('returns ship_by_14d for 14 days out', () => {
    expect(classifyShipByWindow('2026-05-04', today)).toBe('ship_by_14d');
  });
  it('returns ship_by_30d for 30 days out', () => {
    expect(classifyShipByWindow('2026-05-20', today)).toBe('ship_by_30d');
  });
  it('returns null for a date far in the future', () => {
    expect(classifyShipByWindow('2026-07-01', today)).toBeNull();
  });
});

describe('selectOrdersToNotify', () => {
  const today = new Date('2026-04-20T12:00:00Z');

  it('skips shipments already notified at this window', () => {
    const picks = selectOrdersToNotify(
      [{ order_id: 'a', required_ship_by: '2026-05-04', shipment_status: 'in_production' }],
      [{ order_id: 'a', notification_type: 'ship_by_14d' }],
      today,
    );
    expect(picks).toHaveLength(0);
  });

  it('emits a new notification when crossing into a new window', () => {
    const picks = selectOrdersToNotify(
      [{ order_id: 'a', required_ship_by: '2026-04-23', shipment_status: 'in_production' }],
      [{ order_id: 'a', notification_type: 'ship_by_14d' }],
      today,
    );
    expect(picks).toEqual([{ order_id: 'a', notification_type: 'ship_by_3d' }]);
  });

  it('ignores already-shipped orders', () => {
    const picks = selectOrdersToNotify(
      [{ order_id: 'a', required_ship_by: '2026-04-19', shipment_status: 'shipped' }],
      [],
      today,
    );
    expect(picks).toHaveLength(0);
  });

  it('allows overdue to re-fire even if previously logged', () => {
    const picks = selectOrdersToNotify(
      [{ order_id: 'a', required_ship_by: '2026-04-19', shipment_status: 'in_production' }],
      [{ order_id: 'a', notification_type: 'overdue' }],
      today,
    );
    expect(picks).toEqual([{ order_id: 'a', notification_type: 'overdue' }]);
  });
});

describe('renderBulkOrderEmail', () => {
  it('produces a subject with the flag label and quantity', () => {
    const email = renderBulkOrderEmail({
      buyer_name: 'Acme Co',
      buyer_contact: 'buyer@acme.example',
      total_pots: 50,
      required_ship_by: '2026-06-01',
      flag: 'urgent',
      dashboard_url: 'https://example.com/admin/orders/123',
    });
    expect(email.subject).toContain('URGENT');
    expect(email.subject).toContain('50-pot');
    expect(email.text).toContain('Acme Co');
    expect(email.html).toContain('Acme Co');
  });
});

describe('computeDuePosts', () => {
  const today = new Date('2026-04-20T12:00:00Z');

  it('posts once on first run when last_posted_on is null', () => {
    const rent: RecurringExpense = {
      id: 'r1', category: 'rent', amount_cents: 120000,
      recurrence: 'monthly', starts_on: '2026-04-01', ends_on: null, last_posted_on: null,
    };
    const posts = computeDuePosts([rent], today);
    expect(posts).toHaveLength(1);
    expect(posts[0].incurred_on).toBe('2026-04-01');
  });

  it('does not double-post on the same day', () => {
    const rent: RecurringExpense = {
      id: 'r1', category: 'rent', amount_cents: 120000,
      recurrence: 'monthly', starts_on: '2026-04-01', ends_on: null, last_posted_on: '2026-04-01',
    };
    expect(computeDuePosts([rent], today)).toHaveLength(0);
  });

  it('catches up missed postings across intervals', () => {
    const rent: RecurringExpense = {
      id: 'r1', category: 'rent', amount_cents: 120000,
      recurrence: 'monthly', starts_on: '2026-01-01', ends_on: null, last_posted_on: null,
    };
    const posts = computeDuePosts([rent], today);
    // Jan, Feb, Mar, Apr = 4 posts
    expect(posts).toHaveLength(4);
    expect(posts.map((p) => p.incurred_on)).toEqual([
      '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
    ]);
  });

  it('respects ends_on window', () => {
    const insurance: RecurringExpense = {
      id: 'r2', category: 'insurance', amount_cents: 30000,
      recurrence: 'monthly', starts_on: '2026-01-01', ends_on: '2026-02-28', last_posted_on: null,
    };
    const posts = computeDuePosts([insurance], today);
    expect(posts.map((p) => p.incurred_on)).toEqual(['2026-01-01', '2026-02-01']);
  });

  it('ignores expenses whose starts_on is in the future', () => {
    const future: RecurringExpense = {
      id: 'r3', category: 'rent', amount_cents: 99900,
      recurrence: 'monthly', starts_on: '2026-12-01', ends_on: null, last_posted_on: null,
    };
    expect(computeDuePosts([future], today)).toHaveLength(0);
  });

  it('handles quarterly + annual cadences', () => {
    const quarterly: RecurringExpense = {
      id: 'q1', category: 'software', amount_cents: 30000,
      recurrence: 'quarterly', starts_on: '2026-01-01', ends_on: null, last_posted_on: null,
    };
    expect(computeDuePosts([quarterly], today)).toHaveLength(2); // Jan + Apr
  });
});
