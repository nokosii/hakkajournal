import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { readValidatedPdf } from '@/lib/pdf-upload';
import { pdfToMarkdown } from '@/lib/pdf-to-markdown';

type SubmissionOwner = { submitterUserId: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入作者帳號。' }, { status: 401 });
  const { id } = await params;
  const owner = await query<SubmissionOwner>(`SELECT submitter_user_id AS "submitterUserId" FROM submissions
    WHERE id = $1 AND status IN ('open_review','revision')`, [id]);
  if (!owner.rows[0]) return Response.json({ error: '找不到可上傳修正稿的稿件。' }, { status: 404 });
  if (owner.rows[0].submitterUserId !== user.id) return Response.json({ error: '只有原投稿作者可以上傳修正稿。' }, { status: 403 });
  const data = await request.formData();
  const revisionPdf = data.get('revisionPdf');
  const changeSummary = String(data.get('changeSummary') ?? '').trim();
  if (changeSummary.length < 10) return Response.json({ error: '請填寫至少 10 個字的修正說明。' }, { status: 400 });
  if (!(revisionPdf instanceof File)) return Response.json({ error: '請選擇修正稿 PDF。' }, { status: 400 });
  let bytes: Buffer;
  try { bytes = await readValidatedPdf(revisionPdf, '修正稿'); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : '修正稿僅接受 PDF 檔案。' }, { status: 400 }); }
  let articleBody: string;
  try { articleBody = await pdfToMarkdown(bytes); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'PDF 文字擷取失敗。' }, { status: 422 }); }
  const revisionId = randomUUID();
  await query(`INSERT INTO submission_revisions (id,submission_id,uploader_user_id,file_data,file_name,file_type,article_body,change_summary)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [revisionId, id, user.id, bytes, revisionPdf.name, 'application/pdf', articleBody, changeSummary]);
  await query(`UPDATE submissions SET article_body = $2, updated_at = NOW() WHERE id = $1`, [id, articleBody]);
  return Response.json({ saved: true, revisionId, markdownCharacters: articleBody.length }, { status: 201 });
}
