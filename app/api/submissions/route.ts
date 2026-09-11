import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { readValidatedPdf } from '@/lib/pdf-upload';
import { pdfToMarkdown } from '@/lib/pdf-to-markdown';

type SubmissionListRow = { id: string; title: string; authorName: string; affiliation: string | null; category: string; abstract: string; keywords: string | null; status: string; reviewCount: number; issueId: string | null; createdAt: string };

export async function GET() {
  const result = await query<SubmissionListRow>(`SELECT s.id, s.title, s.author_name AS "authorName", s.affiliation,
    s.category, s.abstract, s.keywords, s.status, s.issue_id AS "issueId", s.created_at AS "createdAt",
    COUNT(r.id)::int AS "reviewCount"
    FROM submissions s LEFT JOIN reviews r ON r.submission_id = s.id
    WHERE s.status IN ('open_review', 'revision', 'accepted', 'published')
    GROUP BY s.id ORDER BY s.created_at DESC LIMIT 100`);
  return Response.json({ submissions: result.rows });
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入會員帳號再投稿。' }, { status: 401 });
  const data = await request.formData();
  const title = String(data.get('title') ?? '').trim();
  const titleEn = String(data.get('titleEn') ?? '').trim();
  const authorName = String(data.get('authorName') ?? '').trim();
  const affiliation = String(data.get('affiliation') ?? '').trim();
  const category = String(data.get('category') ?? '').trim();
  const abstract = String(data.get('abstract') ?? '').trim();
  const abstractEn = String(data.get('abstractEn') ?? '').trim();
  const keywords = String(data.get('keywords') ?? '').trim();
  const submissionChannel = data.get('submissionChannel') === 'assisted_email' ? 'assisted_email' : 'member';
  const authorEmail = String(data.get('authorEmail') ?? '').trim().toLowerCase();
  const manuscript = data.get('manuscript');
  const openReviewConsent = data.get('openReviewConsent') === 'on';
  if (submissionChannel === 'assisted_email' && !['assistant_editor', 'editor', 'editor_in_chief'].includes(user.role)) return Response.json({ error: '僅助理編輯、編輯或主編可代特殊作者投稿。' }, { status: 403 });
  if (submissionChannel === 'assisted_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) return Response.json({ error: '請填寫特殊作者的有效聯絡信箱。' }, { status: 400 });
  if (!title || !authorName || !category || abstract.length < 80 || !openReviewConsent || !(manuscript instanceof File)) return Response.json({ error: '請完成必填欄位、公開審查聲明並上傳預印本 PDF。' }, { status: 400 });
  let bytes: Buffer;
  try { bytes = await readValidatedPdf(manuscript, '預印本'); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : '預印本僅接受 PDF 檔案。' }, { status: 400 }); }
  let articleBody: string;
  try { articleBody = await pdfToMarkdown(bytes); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'PDF 文字擷取失敗。' }, { status: 422 }); }
  const id = `JHDH-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  await query(`INSERT INTO submissions
    (id, submitter_user_id, title, title_en, author_name, affiliation, category, abstract, abstract_en, keywords, author_email, submission_channel, preprint_data, preprint_name, preprint_type, article_body)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [id, user.id, title, titleEn || null, authorName, affiliation || null, category, abstract, abstractEn || null, keywords || null, authorEmail || user.email, submissionChannel, bytes, manuscript.name, 'application/pdf', articleBody]);
  return Response.json({ id, status: 'open_review' }, { status: 201 });
}
