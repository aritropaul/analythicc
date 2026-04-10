import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') || '');
  const ok = await login(password);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('err', '1');
    return NextResponse.redirect(url, { status: 303 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/dashboard';
  url.search = '';
  return NextResponse.redirect(url, { status: 303 });
}
