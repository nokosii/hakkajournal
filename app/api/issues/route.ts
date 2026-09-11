import { randomUUID } from 'node:crypto';
import { assertSameOrigin, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  const canEdit = user?.role === 'editor' || user?.role === 'editor_in_chief';
  const result = await query(`SELECT i.id, i.volume, i.number, i.year, i.title, i.description, i.status,
    i.published_at AS "publishedAt", COUNT(s.id)::int AS "articleCount"
    FROM issues i LEFT JOIN submissions s ON s.issue_id = i.id AND s.status = 'published'
    ${canEdit ? '' : "WHERE i.status = 'published'"}
    GROUP BY i.id ORDER BY i.volume DESC, i.number DESC`);
  return Response.json({ issues: result.rows });
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  const user = await getCurrentUser();
  if (!user || !['editor', 'editor_in_chief'].includes(user.role)) return Response.json({ error: '僅編輯可建立期刊卷期。' }, { status: 403 });
  const body = await request.json() as { volume?: number; number?: number; year?: number; title?: string; description?: string };
  const volume = Number(body.volume), number = Number(body.number), year = Number(body.year), title = body.title?.trim() ?? '';
  if (!Number.isInteger(volume) || volume < 1 || !Number.isInteger(number) || number < 1 || !Number.isInteger(year) || year < 2000 || !title) return Response.json({ error: '請填寫有效的卷、期、年份與期刊題名。' }, { status: 400 });
  try {
    const id = randomUUID();
    await query('INSERT INTO issues (id, volume, number, year, title, description, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, volume, number, year, title, body.description?.trim() ?? '', user.id]);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return Response.json({ error: '已存在相同卷期。' }, { status: 409 });
    throw error;
  }
}
