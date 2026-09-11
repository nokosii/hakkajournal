import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { readValidatedPdf } from '@/lib/pdf-upload';
import { pdfToMarkdown } from '@/lib/pdf-to-markdown';

type SubmissionOwner = { submitterUserId: string; status: string; finalName: string | null };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入作者帳號。' }, { status: 401 });

  const { id } = await params;
  const ownerResult = await query<SubmissionOwner>(`SELECT submitter_user_id AS "submitterUserId", status,
    final_name AS "finalName" FROM submissions WHERE id = $1`, [id]);
  const submission = ownerResult.rows[0];
  if (!submission) return Response.json({ error: '找不到稿件。' }, { status: 404 });
  if (submission.submitterUserId !== user.id) return Response.json({ error: '只有原投稿作者可以上傳最終版本。' }, { status: 403 });
  if (!['accepted', 'published'].includes(submission.status)) return Response.json({ error: '稿件接受刊登後才可上傳最終版本。' }, { status: 409 });

  const data = await request.formData();
  const finalPdf = data.get('finalPdf');
  if (!(finalPdf instanceof File)) return Response.json({ error: '請選擇最終版本 PDF。' }, { status: 400 });

  let bytes: Buffer;
  try { bytes = await readValidatedPdf(finalPdf, '最終版本'); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : '最終版本僅接受 PDF 檔案。' }, { status: 400 }); }
  let articleBody: string;
  try { articleBody = await pdfToMarkdown(bytes); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'PDF 文字擷取失敗。' }, { status: 422 }); }

  await query(`UPDATE submissions SET final_data = $2, final_name = $3, final_type = $4,
    final_uploaded_at = NOW(), article_body = $5, updated_at = NOW() WHERE id = $1`, [id, bytes, finalPdf.name, 'application/pdf', articleBody]);
  return Response.json({ ok: true, name: finalPdf.name, markdownCharacters: articleBody.length });
}
