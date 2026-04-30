// Minimal Gmail client used by vendor-billing crons (Vercel + future vendors
// without first-party billing API). Reuses Paisa's Google OAuth credentials.
//
// Environment variables (set in Vercel project env):
//   GOOGLE_OAUTH_CLIENT_ID          ..... OAuth 2.0 client ID
//   GOOGLE_OAUTH_CLIENT_SECRET      ..... OAuth 2.0 client secret
//   GMAIL_VENDOR_REFRESH_TOKEN      ..... long-lived refresh token (offline scope)
//   GMAIL_VENDOR_USER               ..... mailbox to read (default: 'me')
//
// Per Rule "no paid APIs" the Gmail API is free for personal Google accounts
// (1 billion units/day quota, far above this cron's footprint). Per Rule #48
// token-handle-only, the secrets stay in env vars and never enter prompts.

import { google, type gmail_v1 } from 'googleapis';

export type GmailClient = gmail_v1.Gmail;

export type GmailEnvCheck =
  | { ok: true; client: GmailClient; user: string }
  | { ok: false; error: string };

export function getGmailClient(): GmailEnvCheck {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_VENDOR_REFRESH_TOKEN;
  const user = process.env.GMAIL_VENDOR_USER ?? 'me';

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      ok: false,
      error:
        'Gmail OAuth env vars not configured. Set GOOGLE_OAUTH_CLIENT_ID, ' +
        'GOOGLE_OAUTH_CLIENT_SECRET, GMAIL_VENDOR_REFRESH_TOKEN.',
    };
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });
  return { ok: true, client: gmail, user };
}

export type ParsedMessage = {
  id: string;
  internalDate: number;
  subject: string | null;
  from: string | null;
  body: string;
};

// Decode a base64url-encoded Gmail body part to a UTF-8 string.
function decodeB64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf-8');
}

function flattenParts(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return '';
  if (payload.body?.data) return decodeB64Url(payload.body.data);
  if (!payload.parts) return '';
  return payload.parts.map(flattenParts).join('\n');
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const h = headers.find((x) => (x.name ?? '').toLowerCase() === name.toLowerCase());
  return h?.value ?? null;
}

// searchAndParse runs a Gmail query and returns parsed messages with subject,
// from, and concatenated text body. Single-page only ..... cron caller is
// expected to pass a query that fits within Gmail's 100-result default.
export async function searchAndParse(
  client: GmailClient,
  user: string,
  query: string,
  maxResults: number = 50,
): Promise<ParsedMessage[]> {
  const list = await client.users.messages.list({ userId: user, q: query, maxResults });
  const ids = (list.data.messages ?? []).map((m) => m.id).filter((x): x is string => Boolean(x));
  const out: ParsedMessage[] = [];
  for (const id of ids) {
    const msg = await client.users.messages.get({ userId: user, id, format: 'full' });
    const headers = msg.data.payload?.headers ?? [];
    const body = flattenParts(msg.data.payload);
    out.push({
      id,
      internalDate: parseInt(msg.data.internalDate ?? '0', 10),
      subject: getHeader(headers, 'Subject'),
      from: getHeader(headers, 'From'),
      body,
    });
  }
  return out;
}
