import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  await logout();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url, { status: 303 });
}
