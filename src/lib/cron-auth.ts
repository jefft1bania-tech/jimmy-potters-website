// Tiny shared auth check for Vercel cron routes.
//
// Vercel cron invocations send:
//   Authorization: Bearer $CRON_SECRET
// plus an `x-vercel-cron: 1` header when the cron dashboard triggers the job.
// We accept either. When the secret isn't set (local dev), we still allow
// invocation but block in production — that way a forgotten env var during
// deploy doesn't silently leak an open POST endpoint.

export type CronAuthResult = { ok: true } | { ok: false; status: number; error: string };

export function verifyCronRequest(req: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  const vercelCron = req.headers.get('x-vercel-cron');

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 500, error: 'CRON_SECRET not configured' };
    }
    return { ok: true };
  }

  if (auth === `Bearer ${expected}`) return { ok: true };
  if (vercelCron && vercelCron !== '0') return { ok: true };

  return { ok: false, status: 401, error: 'Unauthorized' };
}
