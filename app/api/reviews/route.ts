import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

const recommendations = ['accept', 'minor_revision', 'major_revision', 'reject'];
const scoreKeys = ['scoreRelevance', 'scoreContribution', 'scoreLiterature', 'scoreMethod', 'scoreStructure', 'scoreEthics'] as const;

export async function GET(request: Request) {
  const submissionId = new URL(request.url).searchParams.get('submissionId');
  if (!submissionId) return Response.json({ error: '缺少稿件編號。' }, { status: 400 });
  const result = await query(`SELECT id, reviewer_name AS "reviewerName", score_relevance AS "scoreRelevance",
    score_contribution AS "scoreContribution", score_literature AS "scoreLiterature", score_method AS "scoreMethod",
    score_structure AS "scoreStructure", score_ethics AS "scoreEthics", academic_strengths AS "academicStrengths",
    required_revisions AS "requiredRevisions", other_suggestions AS "otherSuggestions", recommendation, created_at AS "createdAt"
    FROM reviews WHERE submission_id = $1 ORDER BY created_at`, [submissionId]);
  return Response.json({ reviews: result.rows });
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: '請先登入會員帳號再參與審查。' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const scores = scoreKeys.map((key) => body[key] === 'na' || body[key] == null ? null : Number(body[key]));
  const scored = scores.filter((score): score is number => score !== null);
  if (!body.submissionId || !recommendations.includes(String(body.recommendation)) || !body.conflictConfirmed || scored.length < 4 || scored.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) return Response.json({ error: '請完成至少四項評分、總體判定與利益衝突聲明。' }, { status: 400 });
  const strengths = String(body.academicStrengths ?? '').trim();
  const revisions = String(body.requiredRevisions ?? '').trim();
  if (strengths.length < 40 || revisions.length < 40) return Response.json({ error: '學術優點與必要修改請各填寫至少 40 個字。' }, { status: 400 });
  const submission = await query<{ submitterUserId: string }>(`SELECT submitter_user_id AS "submitterUserId" FROM submissions WHERE id = $1 AND status IN ('open_review','revision')`, [body.submissionId]);
  if (!submission.rows[0]) return Response.json({ error: '找不到可審查的預印本。' }, { status: 404 });
  if (submission.rows[0].submitterUserId === user.id) return Response.json({ error: '作者不能審查自己的稿件。' }, { status: 409 });
  try {
    await query(`INSERT INTO reviews (id, submission_id, reviewer_user_id, reviewer_name,
      score_relevance, score_contribution, score_literature, score_method, score_structure, score_ethics,
      academic_strengths, required_revisions, other_suggestions, recommendation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [randomUUID(), body.submissionId, user.id, user.displayName, ...scores, strengths, revisions, String(body.otherSuggestions ?? '').trim(), body.recommendation]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return Response.json({ error: '您已審查過這份預印本。' }, { status: 409 });
    throw error;
  }
  return Response.json({ saved: true }, { status: 201 });
}
