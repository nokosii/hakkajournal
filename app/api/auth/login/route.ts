import { assertSameOrigin, createSession, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';

type LoginUser = { id: string; passwordHash: string; status: string };

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const body = await request.json() as { email?: string; password?: string };
  const result = await query<LoginUser>('SELECT id, password_hash AS "passwordHash", status FROM users WHERE email = $1', [body.email?.trim().toLowerCase()]);
  const user = result.rows[0];
  if (!user || user.status !== 'active' || !await verifyPassword(body.password ?? '', user.passwordHash)) return Response.json({ error: '電子郵件或密碼不正確。' }, { status: 401 });
  await createSession(user.id);
  return Response.json({ ok: true });
}
