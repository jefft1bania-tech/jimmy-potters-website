import { describe, it, expect } from 'vitest';
import {
  isActive,
  tallyStatusCounts,
  WHOLESALE_APPLICATION_STATUSES,
  WHOLESALE_BUYER_TYPES,
} from '../src/lib/wholesale-applications-data';

describe('wholesale-applications constants', () => {
  it('exposes the full status enum in a stable order', () => {
    expect(WHOLESALE_APPLICATION_STATUSES).toEqual([
      'pending',
      'needs_info',
      'approved',
      'rejected',
    ]);
  });

  it('exposes both buyer types', () => {
    expect(WHOLESALE_BUYER_TYPES).toEqual(['business', 'individual']);
  });
});

describe('isActive', () => {
  it('treats pending and needs_info as active', () => {
    expect(isActive('pending')).toBe(true);
    expect(isActive('needs_info')).toBe(true);
  });

  it('treats approved and rejected as terminal', () => {
    expect(isActive('approved')).toBe(false);
    expect(isActive('rejected')).toBe(false);
  });
});

describe('tallyStatusCounts', () => {
  it('returns zeros for an empty queue', () => {
    expect(tallyStatusCounts([])).toEqual({
      pending: 0,
      needs_info: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      total: 0,
    });
  });

  it('aggregates per status and exposes an active total', () => {
    const counts = tallyStatusCounts([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'needs_info' },
      { status: 'approved' },
      { status: 'rejected' },
      { status: 'rejected' },
    ]);

    expect(counts).toEqual({
      pending: 2,
      needs_info: 1,
      approved: 1,
      rejected: 2,
      active: 3, // pending + needs_info
      total: 6,
    });
  });

  it('keeps active and total decoupled so approvals don\'t leak into the queue badge', () => {
    const counts = tallyStatusCounts([
      { status: 'approved' },
      { status: 'approved' },
      { status: 'approved' },
    ]);
    expect(counts.active).toBe(0);
    expect(counts.total).toBe(3);
    expect(counts.approved).toBe(3);
  });
});
