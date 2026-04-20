'use client';

import { useState, useTransition } from 'react';
import AdminVoiceButton from './AdminVoiceButton';

type InsightRow = {
  id: string;
  query_text: string;
  response_markdown: string;
  generated_at: string;
  cached?: boolean;
};

type Props = {
  initialInsights: InsightRow[];
};

const SUGGESTED = [
  'Which SKU is dragging down overall margin?',
  'Am I on track for a profitable month?',
  'What should I ship next to clear overdue orders?',
  'Where is my operating expense budget going this month?',
];

function renderMarkdown(md: string): string {
  // Minimal Markdown → HTML (no deps). Good enough for Claude's short responses.
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split('\n');
  let out = '';
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        out += '<ul class="list-disc ml-5 space-y-1 text-stone-300">';
        inList = true;
      }
      const inner = esc(line.replace(/^\s*[-*]\s+/, ''));
      out += `<li>${inner.replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-100">$1</strong>')}</li>`;
    } else {
      if (inList) {
        out += '</ul>';
        inList = false;
      }
      if (!line.trim()) {
        out += '<div class="h-2"></div>';
      } else if (line.startsWith('### ')) {
        out += `<h3 class="font-heading font-bold text-white text-sm mt-3 mb-1">${esc(line.slice(4))}</h3>`;
      } else if (line.startsWith('## ')) {
        out += `<h2 class="font-heading font-bold text-white text-base mt-3 mb-1">${esc(line.slice(3))}</h2>`;
      } else {
        const bolded = esc(line).replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="text-stone-100">$1</strong>',
        );
        out += `<p class="text-stone-300 leading-relaxed">${bolded}</p>`;
      }
    }
  }
  if (inList) out += '</ul>';
  return out;
}

export default function InsightsChat({ initialInsights }: Props) {
  const [insights, setInsights] = useState<InsightRow[]>(initialInsights);
  const [query, setQuery] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const q = query.trim();
    if (!q) return;
    setErr(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Insight request failed' }));
        setErr(j.error ?? 'Insight request failed');
        return;
      }
      const j = (await res.json()) as {
        id?: string;
        query_text: string;
        response_markdown: string;
        generated_at: string;
        cached?: boolean;
      };
      setInsights((prev) => [
        {
          id: j.id ?? `tmp-${Date.now()}`,
          query_text: j.query_text,
          response_markdown: j.response_markdown,
          generated_at: j.generated_at,
          cached: j.cached,
        },
        ...prev,
      ]);
      setQuery('');
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-faire-detail p-5">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500">
              Ask a question about the business
            </span>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={3}
              placeholder="e.g. Which SKUs drive most of YTD profit?"
              className="bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded px-3 py-2 focus:border-[#C9A96E] focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <AdminVoiceButton
              disabled={pending}
              onFinal={(text) => setQuery((prev) => (prev ? `${prev.trim()} ${text}` : text))}
            />
            <button
              type="button"
              disabled={pending || !query.trim()}
              onClick={submit}
              className="btn-faire !w-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? 'Thinking…' : 'Ask'}
            </button>
            <span className="text-stone-500 text-[11px] ml-2">⌘+Enter to submit</span>
            {err && <span className="text-red-300 text-xs ml-auto">{err}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="text-[10px] font-body text-stone-500 hover:text-[#C9A96E] underline underline-offset-2"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-[11px] font-heading font-bold uppercase tracking-[0.15em] text-stone-500 mb-3">
          History
        </h2>
        {insights.length === 0 ? (
          <div className="card-faire-detail p-6 border border-stone-700">
            <p className="text-stone-400 text-sm">No insights yet. Ask something above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((ins) => (
              <article key={ins.id} className="card-faire-detail p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="text-stone-100 text-sm font-body">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-500 mr-2">
                      Q
                    </span>
                    {ins.query_text}
                  </p>
                  <span className="text-stone-600 text-[10px] font-mono whitespace-nowrap">
                    {new Date(ins.generated_at).toISOString().slice(0, 16).replace('T', ' ')}
                    {ins.cached && <span className="text-[#C9A96E] ml-2">cached</span>}
                  </span>
                </div>
                <div
                  className="prose-sm text-sm space-y-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(ins.response_markdown) }}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
