import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { requireEditor } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EditorDashboard } from './editor-dashboard';
import type { Issue, Member, Submission } from './editor-dashboard';

export const metadata: Metadata = { title: '編輯工作台｜客家與數位人文期刊' };
export const dynamic = 'force-dynamic';

export default async function EditorPage() {
  const user = await requireEditor('/editor');
  const [submissions, issues, members] = await Promise.all([
    query<Omit<Submission, 'createdAt'> & { createdAt: Date | string }>(`SELECT s.id, s.title, s.title_en AS "titleEn", s.author_name AS "authorName", s.abstract,
      s.abstract_en AS "abstractEn", s.keywords, s.status, s.article_body AS "articleBody", s.pages,
      s.doi, s.issue_id AS "issueId", s.editor_notes AS "editorNotes", s.created_at AS "createdAt",
      COUNT(r.id)::int AS "reviewCount", ROUND(AVG((COALESCE(r.score_relevance,0)+COALESCE(r.score_contribution,0)+COALESCE(r.score_literature,0)+COALESCE(r.score_method,0)+COALESCE(r.score_structure,0)+COALESCE(r.score_ethics,0))::numeric / NULLIF((CASE WHEN r.score_relevance IS NULL THEN 0 ELSE 1 END+CASE WHEN r.score_contribution IS NULL THEN 0 ELSE 1 END+CASE WHEN r.score_literature IS NULL THEN 0 ELSE 1 END+CASE WHEN r.score_method IS NULL THEN 0 ELSE 1 END+CASE WHEN r.score_structure IS NULL THEN 0 ELSE 1 END+CASE WHEN r.score_ethics IS NULL THEN 0 ELSE 1 END),0)),1)::float AS "averageScore"
      FROM submissions s LEFT JOIN reviews r ON r.submission_id=s.id GROUP BY s.id ORDER BY s.created_at DESC`),
    query<Omit<Issue, 'publishedAt'> & { publishedAt: Date | string | null }>(`SELECT id, volume, number, year, title, description, status, published_at AS "publishedAt" FROM issues ORDER BY volume DESC, number DESC`),
    user.role === 'editor_in_chief'
      ? query<Omit<Member, 'createdAt'> & { createdAt: Date | string }>(`SELECT id, display_name AS "displayName", email, affiliation, expertise, role, created_at AS "createdAt" FROM users ORDER BY created_at DESC`)
      : Promise.resolve({ rows: [] }),
  ]);
  const normalizedSubmissions: Submission[] = submissions.rows.map((row) => ({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt) }));
  const normalizedIssues = issues.rows.map((row) => ({ ...row, publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : row.publishedAt ? String(row.publishedAt) : null }));
  const normalizedMembers: Member[] = members.rows.map((row) => ({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt) }));
  return <main><SiteHeader /><section className="review-hero editor-hero"><div><p className="eyebrow">EDITORIAL WORKSPACE</p><h1>編輯工作台</h1><p>管理稿件決策、正式文章內容，以及每一期期刊的編排與發布。</p></div><span>{user.role === 'editor_in_chief' ? '主編' : '編輯'} · {user.displayName}</span></section><EditorDashboard initialSubmissions={normalizedSubmissions} initialIssues={normalizedIssues} initialMembers={normalizedMembers} /><SiteFooter /></main>;
}
