'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/modal';

export function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain }),
      });
      if (r.ok) {
        setOpen(false);
        setName('');
        setDomain('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-cream-50 bg-ink-900 hover:bg-ink-800 rounded-full px-4 py-2 shadow-sm transition-all duration-200 ease-out-strong active:scale-[0.97]"
      >
        <span className="text-[14px] leading-none">+</span>
        New project
      </button>
      <Modal open={open} onClose={() => setOpen(false)} className="w-full max-w-md p-7">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <h2 className="font-display text-[1.875rem] text-ink-900 leading-[1] tracking-[-0.015em]">
              New project
            </h2>
            <p className="text-[12px] text-ink-900/50 mt-1.5">Let's track something fresh.</p>
          </div>
          <div>
            <label className="text-[10.5px] font-semibold text-ink-900/65 uppercase tracking-[0.08em] mb-1.5 block">
              Name
            </label>
            <input
              className="input"
              placeholder="My cool site"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10.5px] font-semibold text-ink-900/65 uppercase tracking-[0.08em] mb-1.5 block">
              Domain
            </label>
            <input
              className="input"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-1 pt-2">
            <button
              type="button"
              className="text-[12px] font-medium text-ink-900/50 hover:text-ink-900 px-4 py-2 rounded-full transition-colors active:scale-[0.97]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-cream-50 bg-ink-900 hover:bg-ink-800 rounded-full px-4 py-2 shadow-sm transition-all duration-200 ease-out-strong active:scale-[0.97] disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
