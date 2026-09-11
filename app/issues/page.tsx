import type { Metadata } from 'next';
import { ArrowRight, BookOpen } from 'lucide-react';
import { query } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = { title: '期刊卷期｜客家與數位人文期刊', description: '瀏覽已正式發布的客家與數位人文期刊卷期。' };
export const dynamic = 'force-dynamic';

type Issue = { id: string; volume: number; number: number; year: number; title: string; description: string; publishedAt: string; articleCount: number };

export default async function IssuesPage() {
  const result = await query<Issue>(`SELECT i.id,i.volume,i.number,i.year,i.title,i.description,i.published_at AS "publishedAt",COUNT(s.id)::int AS "articleCount" FROM issues i LEFT JOIN submissions s ON s.issue_id=i.id AND s.status='published' WHERE i.status='published' GROUP BY i.id ORDER BY i.volume DESC,i.number DESC`);
  return <main><SiteHeader /><section className="page-hero"><p className="eyebrow">PUBLISHED ISSUES</p><h1>期刊卷期</h1><p>已完成公開審查、編輯與正式出版的每一期內容。</p></section><section className="issues-page">{result.rows.length ? result.rows.map((issue) => <article className="issue-list-card" key={issue.id}><div className="issue-volume"><span>VOL.</span><b>{String(issue.volume).padStart(2, '0')}</b><small>NO. {issue.number} · {issue.year}</small></div><div><p className="article-type">正式出版 · {issue.articleCount} 篇文章</p><h2>{issue.title}</h2><p>{issue.description}</p><a href={`/issues/${issue.id}`}>閱讀本期 <ArrowRight /></a></div></article>) : <div className="empty-state"><BookOpen /><h2>尚無已發布卷期</h2><p>首期內容完成編輯後將在此公開。</p></div>}</section><SiteFooter /></main>;
}
