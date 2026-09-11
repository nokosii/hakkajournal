import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, MessageSquareText } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

type Preprint = { id: string; title: string; titleEn: string | null; authorName: string; affiliation: string | null; category: string; abstract: string; keywords: string | null; manuscriptName: string; status: string; createdAt: number };
type Review = { id: number; reviewerName: string; recommendation: string; authorComments: string; createdAt: number };
const recommendationLabels: Record<string, string> = { accept: '推薦發表', 'minor-revision': '小幅修改', 'major-revision': '大幅修改', reject: '不予推薦' };

export default async function PreprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preprint = await env.DB.prepare(`SELECT id, title, title_en AS titleEn, author_name AS authorName,
    affiliation, category, abstract, keywords, manuscript_name AS manuscriptName, status, created_at AS createdAt
    FROM submissions WHERE id = ?`).bind(id).first<Preprint>();
  if (!preprint) notFound();
  const reviews = await env.DB.prepare(`SELECT id, reviewer_name AS reviewerName, recommendation,
    author_comments AS authorComments, created_at AS createdAt FROM reviews WHERE submission_id = ? ORDER BY created_at`).bind(id).all<Review>();

  return <main><SiteHeader /><article className="article-page preprint-page">
    <a className="back-link" href="/articles"><ArrowLeft /> 返回預印本與推薦</a>
    <div className="article-title-block"><p className="article-type">{preprint.category} · PREPRINT · 公開審查中</p><h1>{preprint.title}</h1>{preprint.titleEn && <p className="article-title-en">{preprint.titleEn}</p>}<p className="article-byline">{preprint.authorName}</p>{preprint.affiliation && <p className="article-affiliation">{preprint.affiliation}</p>}</div>
    <div className="article-layout">
      <div className="article-content"><section><h2>摘要</h2><p>{preprint.abstract}</p></section><section><h2>關鍵字</h2><div className="keyword-row">{(preprint.keywords ?? '').split(/[、,]/).filter(Boolean).map((keyword) => <span key={keyword}>{keyword.trim()}</span>)}</div></section>
        <section className="public-reviews"><h2>公開審查紀錄</h2>{reviews.results.length ? reviews.results.map((review) => <article key={review.id}><header><div><b>{review.reviewerName}</b><span>公開審查人</span></div><strong>{recommendationLabels[review.recommendation] ?? review.recommendation}</strong></header><p>{review.authorComments}</p><small>{new Date(review.createdAt).toLocaleDateString('zh-TW')}</small></article>) : <div className="no-reviews"><MessageSquareText /><p><b>尚無審查意見</b><br />本稿正在徵求具相關專長的會員審查。</p></div>}</section>
      </div>
      <aside className="article-aside"><p><b>公開版本紀錄</b></p><dl><dt>稿件編號</dt><dd>{preprint.id}</dd><dt>提交日期</dt><dd>{new Date(preprint.createdAt).toLocaleDateString('zh-TW')}</dd><dt>狀態</dt><dd>公開同儕審查中</dd><dt>審查</dt><dd>{reviews.results.length} 份公開意見</dd><dt>授權</dt><dd>CC BY 4.0</dd></dl><Button nativeButton={false} render={<a href={`/api/manuscripts/${preprint.id}`} />} className="download-button"><Download /> 下載預印本</Button><Button nativeButton={false} render={<a href="/review" />} variant="outline"><MessageSquareText /> 參與審查</Button></aside>
    </div>
  </article><SiteFooter /></main>;
}
