import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';

export const runtime = 'edge';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  if (await isAuthed()) redirect('/dashboard');
  const sp = await searchParams;
  const err = sp.err === '1';

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-coral-400 to-peach-300 shadow-peach-sm animate-float inline-block" />
          </div>
          <h1 className="font-display text-[3.5rem] text-ink-900 leading-[0.95] tracking-[-0.015em]">
            analyth<span className="italic text-coral-400">icc</span>
          </h1>
          <p className="text-[12.5px] text-ink-900/45 mt-2">
            fun analytics for your projects
          </p>
        </div>

        <form
          action="/api/auth/login"
          method="POST"
          className="card p-7 space-y-5 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          <div>
            <label className="text-[11px] font-semibold text-ink-900/70 uppercase tracking-[0.08em] mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="••••••••"
              className="input"
            />
          </div>
          {err && (
            <p className="text-[12px] text-coral-500 bg-coral-500/[0.06] border border-coral-500/20 rounded-xl px-3 py-2">
              Nope, wrong password. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-cream-50 bg-ink-900 hover:bg-ink-800 rounded-full px-4 py-3 shadow-sm transition-all duration-200 ease-out-strong active:scale-[0.98]"
          >
            Let me in
            <span>→</span>
          </button>
        </form>

        <p
          className="text-center text-[10.5px] text-ink-900/30 mt-8 animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          single-user mode · set <code className="text-coral-500/80">ADMIN_PASSWORD</code> in env
        </p>
      </div>
    </main>
  );
}
