import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';

export const runtime = 'edge';

export default async function Home() {
  if (await isAuthed()) redirect('/dashboard');
  redirect('/login');
}
