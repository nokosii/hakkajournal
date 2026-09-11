import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user || !['editor', 'editor_in_chief'].includes(user.role)) return Response.json({ error: '僅編輯可發布期刊。' }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as { status?: string; title?: string; description?: string };
  if (body.status && !['draft', 'published'].includes(body.status)) return Response.json({ error: '卷期狀態不正確。' }, { status: 400 });
  if (body.status === 'published') {
    const count = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM submissions WHERE issue_id = $1 AND status = 'published'", [id]);
    if (!count.rows[0]?.count) return Response.json({ error: '卷期至少需要一篇已發布文章。' }, { status: 400 });
  }
  await query(`UPDATE issues SET title = COALESCE($2, title), description = COALESCE($3, description),
    status = COALESCE($4, status), published_at = CASE WHEN $4 = 'published' THEN COALESCE(published_at, NOW()) WHEN $4 = 'draft' THEN NULL ELSE published_at END
    WHERE id = $1`, [id, body.title?.trim() || null, body.description?.trim() ?? null, body.status ?? null]);
  return Response.json({ saved: true });
}
