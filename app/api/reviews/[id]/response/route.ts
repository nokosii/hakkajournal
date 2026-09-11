import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

type ReviewOwner = { reviewId: string; submissionId: string; submitterUserId: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入作者帳號。' }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { responseText?: string };
  const responseText = String(body.responseText ?? '').trim();
  if (responseText.length < 20) return Response.json({ error: '作者回應請至少填寫 20 個字。' }, { status: 400 });
  const owner = await query<ReviewOwner>(`SELECT r.id AS "reviewId", r.submission_id AS "submissionId",
    s.submitter_user_id AS "submitterUserId" FROM reviews r JOIN submissions s ON s.id = r.submission_id WHERE r.id = $1`, [id]);
  if (!owner.rows[0]) return Response.json({ error: '找不到審查意見。' }, { status: 404 });
  if (owner.rows[0].submitterUserId !== user.id) return Response.json({ error: '只有原投稿作者可以回應這份審查。' }, { status: 403 });
  await query(`INSERT INTO review_responses (id, review_id, submission_id, author_user_id, response_text)
    VALUES ($1,$2,$3,$4,$5) ON CONFLICT (review_id) DO UPDATE SET response_text = EXCLUDED.response_text, updated_at = NOW()`,
    [randomUUID(), id, owner.rows[0].submissionId, user.id, responseText]);
  return Response.json({ saved: true });
}
