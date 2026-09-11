import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user || !['editor', 'editor_in_chief'].includes(user.role)) return Response.json({ error: '僅編輯可編輯與發布文章。' }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const status = String(body.status ?? '');
  if (!['open_review', 'revision', 'accepted', 'published', 'rejected'].includes(status)) return Response.json({ error: '稿件狀態不正確。' }, { status: 400 });
  const title = String(body.title ?? '').trim(), abstract = String(body.abstract ?? '').trim(), articleBody = String(body.articleBody ?? '').trim();
  const issueId = String(body.issueId ?? '').trim() || null;
  if (!title || abstract.length < 80) return Response.json({ error: '題名與摘要為必填。' }, { status: 400 });
  if (status === 'published' && (!issueId || articleBody.length < 100)) return Response.json({ error: '正式發布前，請指定卷期並完成至少 100 字的文章正文。' }, { status: 400 });
  if (status === 'published') {
    const finalPdf = await query<{ finalName: string | null }>('SELECT final_name AS "finalName" FROM submissions WHERE id = $1', [id]);
    if (!finalPdf.rows[0]?.finalName) return Response.json({ error: '正式發布前，請先請作者上傳最終版本 PDF。' }, { status: 400 });
  }
  await query(`UPDATE submissions SET title=$2, title_en=$3, abstract=$4, abstract_en=$5, keywords=$6,
    article_body=$7, pages=$8, doi=$9, issue_id=$10, status=$11, editor_notes=$12,
    published_at=CASE WHEN $11='published' THEN COALESCE(published_at,NOW()) ELSE published_at END,
    updated_at=NOW() WHERE id=$1`, [id, title, String(body.titleEn ?? '').trim() || null, abstract, String(body.abstractEn ?? '').trim() || null, String(body.keywords ?? '').trim() || null, articleBody, String(body.pages ?? '').trim() || null, String(body.doi ?? '').trim() || null, issueId, status, String(body.editorNotes ?? '').trim()]);
  return Response.json({ saved: true });
}
