import { TopNav } from '@/components/top-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      <TopNav />
      <main className="py-10">{children}</main>
    </div>
  );
}
