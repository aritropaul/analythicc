import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function db() {
  const { env } = getRequestContext();
  return drizzle(env.DB, { schema });
}

export function env() {
  return getRequestContext().env;
}
