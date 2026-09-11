import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入會員再留言。' }, { status: 401 });
  const body = await request.json() as { subject?: string; message?: string };
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();
  if (subject.length < 2 || subject.length > 80 || message.length < 10 || message.length > 1000) return Response.json({ error: '主旨須為 2–80 字，留言內容須為 10–1000 字。' }, { status: 400 });
  await query(`INSERT INTO guestbook_messages (id,user_id,display_name,subject,message) VALUES ($1,$2,$3,$4,$5)`, [randomUUID(), user.id, user.displayName, subject, message]);
  return Response.json({ saved: true }, { status: 201 });
}
