import { randomUUID } from 'node:crypto';
import { assertSameOrigin, createSession, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const body = await request.json() as { email?: string; password?: string; displayName?: string; affiliation?: string; expertise?: string };
  const email = body.email?.trim().toLowerCase() ?? '';
  const displayName = body.displayName?.trim() ?? '';
  const password = body.password ?? '';
  if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || password.length < 12) return Response.json({ error: '請填寫有效信箱、姓名，並使用至少 12 個字元的密碼。' }, { status: 400 });
  const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount) return Response.json({ error: '此電子郵件已註冊。' }, { status: 409 });
  const id = randomUUID();
  await query(`INSERT INTO users (id, email, password_hash, display_name, affiliation, expertise)
    VALUES ($1, $2, $3, $4, $5, $6)`, [id, email, await hashPassword(password), displayName, body.affiliation?.trim() || null, body.expertise?.trim() || null]);
  await createSession(id);
  return Response.json({ ok: true }, { status: 201 });
}
