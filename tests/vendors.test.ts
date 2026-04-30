import { describe, it, expect } from 'vitest';
import { computeNextAction, type VendorRow } from '../src/lib/vendors-data';
import { extractDomain } from '../src/lib/vendors-rdap';
import { parseVercelInvoiceBody } from '../src/lib/vendors-vercel-parse';

function baseVendor(overrides: Partial<VendorRow>): VendorRow {
  return {
    id: 'v-1',
    name: 'Test',
    role: 'other',
    login_url: null,
    account_email: null,
    monthly_cost_usd: null,
    monthly_cost_cop: null,
    cost_rate_date: null,
    cost_rate_source: null,
    billing_day_of_month: null,
    contract_term_months: null,
    contract_starts_at: null,
    contract_ends_at: null,
    auto_renew: false,
    cancellation_deadline_days: null,
    domain_expires_at: null,
    domain_last_checked_at: null,
    w9_on_file: false,
    w9_document_id: null,
    coi_on_file: false,
    coi_document_id: null,
    coi_expires_at: null,
    status: 'active',
    notes: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

describe('computeNextAction', () => {
  const today = new Date('2026-04-30T00:00:00Z');

  it('returns null when no candidates set', () => {
    const v = baseVendor({});
    expect(computeNextAction(v, today)).toEqual({ date: null, label: null, days: null });
  });

  it('picks COI expiry when soonest', () => {
    const v = baseVendor({ coi_expires_at: '2026-05-15', contract_ends_at: '2026-06-30' });
    const result = computeNextAction(v, today);
    expect(result.date).toBe('2026-05-15');
    expect(result.label).toBe('COI renewal');
    expect(result.days).toBe(15);
  });

  it('subtracts cancellation lead days from contract end', () => {
    const v = baseVendor({
      contract_ends_at: '2026-06-30',
      cancellation_deadline_days: 30,
    });
    const result = computeNextAction(v, today);
    expect(result.date).toBe('2026-05-31');
    expect(result.label).toContain('Cancel-by');
  });

  it('only considers domain expiry when role=domain', () => {
    const otherRole = baseVendor({ role: 'hosting', domain_expires_at: '2026-05-10T00:00:00Z' });
    expect(computeNextAction(otherRole, today)).toEqual({ date: null, label: null, days: null });

    const domainRole = baseVendor({ role: 'domain', domain_expires_at: '2026-05-10T00:00:00Z' });
    expect(computeNextAction(domainRole, today).date).toBe('2026-05-10');
  });

  it('skips past-dated candidates', () => {
    const v = baseVendor({ coi_expires_at: '2026-01-01', contract_ends_at: '2026-12-31' });
    const result = computeNextAction(v, today);
    expect(result.date).toBe('2026-12-31');
    expect(result.label).toBe('Contract end');
  });
});

describe('extractDomain', () => {
  it('strips www and lowercases hostname from login URL', () => {
    expect(extractDomain('Anything', 'https://www.Example.COM/admin')).toBe('example.com');
  });

  it('returns hostname with subdomain intact for non-www host', () => {
    expect(extractDomain('Anything', 'https://dashboard.vercel.com')).toBe('dashboard.vercel.com');
  });

  it('falls back to name when login URL invalid', () => {
    expect(extractDomain('jimmypotters.com', 'not a url')).toBe('jimmypotters.com');
  });

  it('returns null for non-domain name with no URL', () => {
    expect(extractDomain('Acme Inc', null)).toBeNull();
  });
});

describe('parseVercelInvoiceBody', () => {
  it('parses labeled total with iso period', () => {
    const body = 'Vercel Inc.\nTotal Due: $20.00\nPeriod 2026-04-01 to 2026-04-30\n';
    const result = parseVercelInvoiceBody(body);
    expect(result).toEqual({
      amount_usd: 20,
      period_start_iso: '2026-04-01',
      period_end_iso: '2026-04-30',
    });
  });

  it('falls back to largest dollar amount when no label present', () => {
    const body = 'Charge $4.50 for usage. Subtotal $40.00. Bill $44.50 paid.';
    const result = parseVercelInvoiceBody(body);
    expect(result?.amount_usd).toBe(44.5);
  });

  it('handles long-form date pair', () => {
    const body = 'Total: $100\nPeriod Apr 1, 2026 - Apr 30, 2026\n';
    const result = parseVercelInvoiceBody(body);
    expect(result?.period_start_iso).toBe('2026-04-01');
    expect(result?.period_end_iso).toBe('2026-04-30');
  });

  it('returns null when no amount present', () => {
    expect(parseVercelInvoiceBody('No charges this period.')).toBeNull();
  });
});
