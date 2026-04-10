import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db } from '@/lib/db';
import { sites } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

function makeId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rows = await db().select().from(sites).orderBy(desc(sites.createdAt));
  return NextResponse.json({ sites: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { name?: string; domain?: string };
  const name = (body.name || '').trim();
  const domain = (body.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!name || !domain) {
    return NextResponse.json({ error: 'name and domain required' }, { status: 400 });
  }
  const id = makeId();
  await db().insert(sites).values({ id, name, domain });
  return NextResponse.json({ id, name, domain });
}
