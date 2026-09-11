import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, Quote } from 'lucide-react';
import { query } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
type Article = { id: string; title: string; titleEn: string | null; authorName: string; affiliation: string | null; category: string; abstract: string; abstractEn: string | null; keywords: string | null; articleBody: string; pages: string | null; doi: string | null; publishedAt: string; volume: number; number: number; year: number; issueTitle: string };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await query<{ title: string; abstract: string }>("SELECT title,abstract FROM submissions WHERE id=$1 AND status='published'", [id]);
  return result.rows[0] ? { title: `${result.rows[0].title}｜客家與數位人文期刊`, description: result.rows[0].abstract, openGraph: { images: [] }, twitter: { images: [] } } : { title: '找不到文章｜客家與數位人文期刊' };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await query<Article>(`SELECT s.id,s.title,s.title_en AS "titleEn",s.author_name AS "authorName",s.affiliation,s.category,s.abstract,s.abstract_en AS "abstractEn",s.keywords,s.article_body AS "articleBody",s.pages,s.doi,s.published_at AS "publishedAt",i.volume,i.number,i.year,i.title AS "issueTitle" FROM submissions s JOIN issues i ON i.id=s.issue_id WHERE s.id=$1 AND s.status='published' AND i.status='published'`, [id]);
  const article = result.rows[0]; if (!article) notFound();
  return <main><SiteHeader /><article className="article-page"><div className="article-nav-links"><a className="back-link" href={`/issues`}><ArrowLeft /> 返回期刊卷期</a><a className="back-link" href={`/preprints/${article.id}`}>預印本與審查紀錄</a></div><div className="article-title-block"><p className="article-type">{article.category} · FORMAL PUBLICATION</p><h1>{article.title}</h1>{article.titleEn && <p className="article-title-en">{article.titleEn}</p>}<p className="article-byline">{article.authorName}</p>{article.affiliation && <p className="article-affiliation">{article.affiliation}</p>}</div><div className="article-layout"><div className="article-content"><section><h2>摘要</h2><p>{article.abstract}</p></section>{article.abstractEn && <section><h2>Abstract</h2><p className="abstract-en">{article.abstractEn}</p></section>}<section><h2>正文</h2><div className="formal-article-body">{article.articleBody.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section><section><h2>關鍵字</h2><div className="keyword-row">{(article.keywords ?? '').split(/[、,]/).filter(Boolean).map((keyword) => <span key={keyword}>{keyword.trim()}</span>)}</div></section><div className="citation-box"><Quote /><div><b>引用格式</b><p>{article.authorName}（{article.year}）。〈{article.title}〉。《客家與數位人文期刊》，{article.volume}({article.number})，{article.pages ?? '頁次待定'}。</p></div></div></div><aside className="article-aside"><p><b>出版資訊</b></p><dl><dt>卷期</dt><dd>第 {article.volume} 卷第 {article.number} 期</dd><dt>專題</dt><dd>{article.issueTitle}</dd><dt>出版日期</dt><dd>{new Date(article.publishedAt).toLocaleDateString('zh-TW')}</dd><dt>頁次</dt><dd>{article.pages ?? '待定'}</dd>{article.doi && <><dt>DOI</dt><dd>{article.doi}</dd></>}<dt>授權</dt><dd>CC BY 4.0</dd></dl><Button nativeButton={false} render={<a href={`/api/manuscripts/${article.id}`} />} className="download-button"><Download /> 下載 PDF</Button></aside></div></article><SiteFooter /></main>;
}
