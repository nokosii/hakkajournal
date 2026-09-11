import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const dynamic = 'force-dynamic';
type Issue = { id: string; volume: number; number: number; year: number; title: string; description: string; status: string; publishedAt: string | null };
type Article = { id: string; title: string; titleEn: string | null; authorName: string; category: string; abstract: string; pages: string | null; doi: string | null };

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await getCurrentUser(); const canPreview = user && ['editor', 'editor_in_chief'].includes(user.role);
  const issueResult = await query<Issue>(`SELECT id,volume,number,year,title,description,status,published_at AS "publishedAt" FROM issues WHERE id=$1 ${canPreview ? '' : "AND status='published'"}`, [id]);
  const issue = issueResult.rows[0]; if (!issue) notFound();
  const articles = await query<Article>("SELECT id,title,title_en AS \"titleEn\",author_name AS \"authorName\",category,abstract,pages,doi FROM submissions WHERE issue_id=$1 AND status='published' ORDER BY published_at,id", [id]);
  return <main><SiteHeader /><section className="issue-detail-hero"><a className="back-link" href="/issues"><ArrowLeft /> 返回期刊卷期</a><p className="eyebrow">VOL. {issue.volume} · NO. {issue.number} · {issue.year}</p><h1>{issue.title}</h1><p>{issue.description}</p>{issue.status === 'draft' && <span>編輯預覽 · 尚未公開</span>}</section><section className="issue-toc"><div className="section-heading"><div><p className="eyebrow">TABLE OF CONTENTS</p><h2>本期目錄</h2></div><span>{articles.rows.length} 篇文章</span></div>{articles.rows.map((article, index) => <article key={article.id}><span>{String(index + 1).padStart(2, '0')}</span><div><p className="article-type">{article.category}</p><h3><a href={`/articles/${article.id}`}>{article.title}</a></h3>{article.titleEn && <p className="article-en">{article.titleEn}</p>}<p>{article.authorName}{article.pages && ` · ${article.pages}`}{article.doi && ` · DOI ${article.doi}`}</p></div><a href={`/articles/${article.id}`} aria-label={`閱讀${article.title}`}><ArrowRight /></a></article>)}</section><SiteFooter /></main>;
}
