import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { isAuthed } from '@/lib/auth';
import { db } from '@/lib/db';
import { sites } from '@/lib/schema';

export const runtime = 'edge';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await db().delete(sites).where(eq(sites.id, id));
  return NextResponse.json({ ok: true });
}
