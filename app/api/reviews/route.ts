import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function GET(request: Request) {
  const submissionId = new URL(request.url).searchParams.get('submissionId');
  if (!submissionId) return Response.json({ error: '缺少稿件編號。' }, { status: 400 });
  const result = await env.DB.prepare(`SELECT reviewer_name AS reviewerName, recommendation,
    author_comments AS authorComments, created_at AS createdAt FROM reviews
    WHERE submission_id = ? ORDER BY created_at ASC`).bind(submissionId).all();
  return Response.json({ reviews: result.results });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: '請先登入會員帳號再參與審查。' }, { status: 401 });
  const body = await request.json() as { submissionId?: string; recommendation?: string; authorComments?: string; conflictConfirmed?: boolean };
  if (!body.submissionId || !body.recommendation || !body.authorComments?.trim() || !body.conflictConfirmed) return Response.json({ error: '請完成公開審查意見並確認利益衝突聲明。' }, { status: 400 });
  const allowed = ['accept', 'minor-revision', 'major-revision', 'reject'];
  if (!allowed.includes(body.recommendation)) return Response.json({ error: '審查建議無效。' }, { status: 400 });
  const submission = await env.DB.prepare('SELECT submitter_user_id AS submitterUserId FROM submissions WHERE id = ?').bind(body.submissionId).first<{ submitterUserId: string }>();
  if (!submission) return Response.json({ error: '找不到這份稿件。' }, { status: 404 });
  if (submission.submitterUserId === user.userId) return Response.json({ error: '作者不能審查自己的稿件。' }, { status: 409 });
  await env.DB.prepare('INSERT INTO reviews (submission_id, reviewer_user_id, reviewer_name, recommendation, confidential_comments, author_comments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(body.submissionId, user.userId, user.displayName, body.recommendation, '', body.authorComments.trim(), Date.now()).run();
  return Response.json({ saved: true }, { status: 201 });
}
