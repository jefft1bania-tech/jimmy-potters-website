import { describe, it, expect } from 'vitest';
import {
  WHOLESALE_ACCOUNT_STATUSES,
  canResendInvite,
  isActiveAccount,
  normalizeEmail,
  type WholesaleAccount,
} from '../src/lib/wholesale-accounts-data';

describe('wholesale-accounts constants', () => {
  it('exposes the full status enum in a stable order', () => {
    expect(WHOLESALE_ACCOUNT_STATUSES).toEqual(['invited', 'active', 'suspended']);
  });
});

describe('normalizeEmail', () => {
  it('lowercases + trims whitespace', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });

  it('leaves already-clean emails intact', () => {
    expect(normalizeEmail('abc@example.com')).toBe('abc@example.com');
  });
});

function makeAccount(overrides: Partial<WholesaleAccount> = {}): WholesaleAccount {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    application_id: '00000000-0000-0000-0000-000000000002',
    profile_id: null,
    contact_email: 'buyer@example.com',
    company_name: 'Buyer Co',
    status: 'invited',
    invited_by: null,
    invited_at: '2026-04-21T00:00:00Z',
    activated_at: null,
    last_invite_sent_at: '2026-04-21T00:00:00Z',
    created_at: '2026-04-21T00:00:00Z',
    updated_at: '2026-04-21T00:00:00Z',
    ...overrides,
  };
}

describe('canResendInvite', () => {
  it('allows resending while the account is still invited', () => {
    expect(canResendInvite(makeAccount({ status: 'invited' }))).toBe(true);
  });

  it('blocks resending once activated', () => {
    expect(canResendInvite(makeAccount({ status: 'active' }))).toBe(false);
  });

  it('blocks resending while suspended', () => {
    expect(canResendInvite(makeAccount({ status: 'suspended' }))).toBe(false);
  });
});

describe('isActiveAccount', () => {
  it('is true only when status is active', () => {
    expect(isActiveAccount({ status: 'active' })).toBe(true);
    expect(isActiveAccount({ status: 'invited' })).toBe(false);
    expect(isActiveAccount({ status: 'suspended' })).toBe(false);
  });
});
