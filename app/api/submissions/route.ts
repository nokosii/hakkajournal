import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function GET() {
  const result = await env.DB.prepare(`SELECT s.id, s.title, s.author_name AS authorName, s.affiliation,
    s.category, s.abstract, s.keywords, s.status, s.created_at AS createdAt, COUNT(r.id) AS reviewCount
    FROM submissions s LEFT JOIN reviews r ON r.submission_id = s.id
    WHERE s.status IN ('submitted', 'open-review', 'revision')
    GROUP BY s.id ORDER BY s.created_at DESC LIMIT 40`).all();
  return Response.json({ submissions: result.results });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: '請先登入會員帳號再投稿。' }, { status: 401 });
  const data = await request.formData();
  const title = String(data.get('title') ?? '').trim(); const titleEn = String(data.get('titleEn') ?? '').trim();
  const authorName = String(data.get('authorName') ?? '').trim(); const email = String(data.get('email') ?? '').trim();
  const affiliation = String(data.get('affiliation') ?? '').trim(); const category = String(data.get('category') ?? '').trim();
  const abstract = String(data.get('abstract') ?? '').trim(); const keywords = String(data.get('keywords') ?? '').trim();
  const manuscript = data.get('manuscript');
  const openReviewConsent = data.get('openReviewConsent') === 'on';
  if (!title || !authorName || !email || !category || !abstract || !openReviewConsent || !(manuscript instanceof File) || manuscript.size === 0) return Response.json({ error: '請填寫所有必填欄位、同意公開審查並上傳稿件。' }, { status: 400 });
  if (email.toLowerCase() !== user.email.toLowerCase()) return Response.json({ error: '投稿信箱必須與登入會員帳號相同。' }, { status: 400 });
  if (manuscript.size > 20 * 1024 * 1024) return Response.json({ error: '稿件檔案不得超過 20 MB。' }, { status: 400 });
  const extension = manuscript.name.split('.').pop()?.toLowerCase();
  if (!extension || !['pdf', 'doc', 'docx'].includes(extension)) return Response.json({ error: '稿件僅接受 PDF、DOC 或 DOCX。' }, { status: 400 });
  const id = `JHDH-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const safeName = manuscript.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, '_');
  const manuscriptKey = `submissions/${id}/${safeName}`;
  await env.UPLOADS.put(manuscriptKey, await manuscript.arrayBuffer(), { httpMetadata: { contentType: manuscript.type || 'application/octet-stream' } });
  await env.DB.prepare(`INSERT INTO submissions
    (id, submitter_user_id, title, title_en, author_name, email, affiliation, category, abstract, keywords, manuscript_key, manuscript_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open-review', ?)`) 
    .bind(id, user.userId, title, titleEn, authorName, email, affiliation, category, abstract, keywords, manuscriptKey, manuscript.name, Date.now()).run();
  return Response.json({ id, status: 'open-review' }, { status: 201 });
}
