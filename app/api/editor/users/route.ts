import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

const assignableRoles = ['member', 'assistant_editor', 'editor'] as const;

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== 'editor_in_chief') {
    return Response.json({ error: '僅主編可調整會員角色。' }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; role?: string };
  if (!body.userId || !assignableRoles.includes(body.role as (typeof assignableRoles)[number])) {
    return Response.json({ error: '會員或角色不正確。' }, { status: 400 });
  }
  if (body.userId === user.id) {
    return Response.json({ error: '主編不能在此變更自己的角色。' }, { status: 409 });
  }

  const result = await query('UPDATE users SET role = $2 WHERE id = $1 AND role <> $3', [body.userId, body.role, 'editor_in_chief']);
  if (!result.rowCount) return Response.json({ error: '找不到可調整的會員。' }, { status: 404 });
  return Response.json({ saved: true });
}
