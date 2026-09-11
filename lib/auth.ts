import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'jhdh_session';
const SESSION_DAYS = 30;

export type UserRole = 'member' | 'editor' | 'editor_in_chief';
export type CurrentUser = { id: string; email: string; displayName: string; affiliation: string | null; expertise: string | null; role: UserRole };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, stored] = encoded.split(':');
  if (algorithm !== 'scrypt' || !salt || !stored) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(stored, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash, userId, expiresAt]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: expiresAt });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [createHash('sha256').update(token).digest('hex')]).catch(() => undefined);
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !process.env.DATABASE_URL) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const result = await query<CurrentUser>(`SELECT u.id, u.email, u.display_name AS "displayName", u.affiliation, u.expertise, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.status = 'active'`, [tokenHash]);
  return result.rows[0] ?? null;
}

export async function requireUser(returnTo = '/') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return user;
}

export async function requireEditor(returnTo = '/editor') {
  const user = await requireUser(returnTo);
  if (user.role !== 'editor' && user.role !== 'editor_in_chief') redirect('/');
  return user;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new Error('INVALID_ORIGIN');
}

function safeReturnTo(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
