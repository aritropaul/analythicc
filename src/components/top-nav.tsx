import Link from 'next/link';

export function TopNav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-50/90 to-cream-50/0 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-6 h-14 grid grid-cols-3 items-center">
        <div className="justify-self-start" />
        <Link href="/dashboard" className="justify-self-center flex items-center gap-2.5 group">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-coral-400 to-peach-300 shadow-peach-sm group-hover:scale-110 transition-transform" />
          <span className="font-display text-xl text-ink-900 tracking-tight leading-none">
            analyth<span className="italic text-coral-400">icc</span>
          </span>
        </Link>
        <form action="/api/auth/logout" method="POST" className="justify-self-end">
          <button
            type="submit"
            className="text-[10.5px] font-semibold text-ink-900/70 uppercase tracking-[0.08em] hover:text-ink-900 hover:bg-peach-100/60 border border-ink-900/10 rounded-full px-3 py-1.5 transition-all"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
