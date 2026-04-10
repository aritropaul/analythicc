import { cookies } from 'next/headers';
import { env } from './db';

const COOKIE = 'ana_sess';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(key: string, data: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(data));
  return b64url(sig);
}

export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(): Promise<string> {
  const secret = env().SESSION_SECRET;
  const payload = JSON.stringify({ u: 'admin', iat: Date.now() });
  const body = b64url(new TextEncoder().encode(payload));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifySession(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  const secret = env().SESSION_SECRET;
  const expected = await hmac(secret, body);
  if (expected !== sig) return false;
  try {
    const json = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!json || json.u !== 'admin') return false;
    if (Date.now() - json.iat > MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  const expected = env().ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const token = await createSession();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  return verifySession(token);
}

export const SESSION_COOKIE = COOKIE;
