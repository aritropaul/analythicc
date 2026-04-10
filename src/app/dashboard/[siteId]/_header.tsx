'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/modal';
import type { Site } from '@/lib/schema';

type Variant = 'html' | 'next';

export function SiteHeader({ site }: { site: Site }) {
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variant, setVariant] = useState<Variant>('html');
  const router = useRouter();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const htmlSnippet = `<script defer src="${origin}/tracker.js" data-site="${site.id}"></script>`;
  const nextSnippet = `import Script from 'next/script';

<Script
  src="${origin}/tracker.js?site=${site.id}"
  strategy="afterInteractive"
/>`;
  const currentSnippet = variant === 'next' ? nextSnippet : htmlSnippet;

  async function copy() {
    try {
      await navigator.clipboard.writeText(currentSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function del() {
    if (!confirm(`Delete ${site.name}? All its data will be gone forever.`)) return;
    const r = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' });
    if (r.ok) router.push('/dashboard');
  }

  return (
    <div className="flex items-end justify-between flex-wrap gap-6 animate-fade-up">
      <div className="min-w-0 group">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-[11.5px] text-ink-900/40 hover:text-ink-900/80 mb-2 transition-colors duration-200"
        >
          <span className="inline-block transition-transform duration-200 ease-out-strong group-hover:-translate-x-[2px]">
            ←
          </span>
          All projects
        </Link>
        <h1 className="font-display text-[3.25rem] text-ink-900 leading-[0.92] tracking-[-0.015em]">
          {site.name}
        </h1>
        <a
          href={`https://${site.domain}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-ink-900/40 hover:text-coral-500 text-[12.5px] mt-1.5 transition-colors duration-200 font-mono"
        >
          {site.domain}
          <span className="text-[9px] translate-y-[-1px]">↗</span>
        </a>
      </div>
      <div className="flex items-center gap-1 pb-1">
        <button
          onClick={() => setSnippetOpen(true)}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-900 bg-white/70 border border-ink-900/[0.08] rounded-full px-3.5 py-1.5 hover:bg-white hover:border-ink-900/[0.12] hover:shadow-sm transition-all duration-200 ease-out-strong active:scale-[0.97]"
        >
          <span className="text-coral-500">⚡</span>
          Install snippet
        </button>
        <button
          onClick={del}
          className="text-[12px] font-medium text-ink-900/40 hover:text-coral-500 rounded-full px-3 py-1.5 transition-colors duration-200 active:scale-[0.97]"
        >
          Delete
        </button>
      </div>

      <Modal
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        className="w-full max-w-2xl p-8"
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[1.875rem] text-ink-900 leading-[1] tracking-[-0.015em]">
                Install tracker
              </h2>
              <p className="text-[12.5px] text-ink-900/55 mt-1.5">
                Track <span className="text-ink-900 font-medium">{site.domain}</span> by adding this
                to every page.
              </p>
            </div>
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-ink-900/[0.04] border border-ink-900/[0.06] shrink-0">
              {(['html', 'next'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-200 ${
                    variant === v
                      ? 'bg-ink-900 text-cream-50'
                      : 'text-ink-900/55 hover:text-ink-900'
                  }`}
                >
                  {v === 'html' ? 'HTML' : 'Next.js'}
                </button>
              ))}
            </div>
          </div>
          <pre className="bg-ink-900 text-cream-50 rounded-2xl p-4 text-[12px] overflow-x-auto font-mono leading-relaxed whitespace-pre">
            {currentSnippet}
          </pre>
          <div className="text-[12px] text-ink-900/60 space-y-1.5 border-t border-ink-900/[0.06] pt-4">
            {variant === 'next' && (
              <p className="flex gap-2">
                <span className="text-ink-900/40 shrink-0 w-28">Why ?site=</span>
                <span>
                  Next.js{' '}
                  <code className="text-coral-500 font-mono text-[11px]">&lt;Script&gt;</code> dedupes
                  by <code className="text-coral-500 font-mono text-[11px]">src</code>, so the query
                  string makes each tag unique.
                </span>
              </p>
            )}
            <p className="flex gap-2">
              <span className="text-ink-900/40 shrink-0 w-28">Custom events</span>
              <code className="text-coral-500 font-mono text-[11px]">
                window.ana('event', 'signup_click')
              </code>
            </p>
            <p className="flex gap-2">
              <span className="text-ink-900/40 shrink-0 w-28">Dev tracking</span>
              <span>
                add <code className="text-coral-500 font-mono text-[11px]">data-track-localhost</code> to the script
                tag
              </span>
            </p>
          </div>
          <div className="flex items-center justify-end gap-1 pt-1">
            <button
              className="text-[12px] font-medium text-ink-900/50 hover:text-ink-900 px-4 py-2 rounded-full transition-colors active:scale-[0.97]"
              onClick={() => setSnippetOpen(false)}
            >
              Close
            </button>
            <button
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-cream-50 bg-ink-900 hover:bg-ink-800 rounded-full px-4 py-2 shadow-sm transition-all duration-200 ease-out-strong active:scale-[0.97]"
              onClick={copy}
            >
              {copied ? '✓ Copied' : 'Copy snippet'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
