import { notFound } from 'next/navigation';
import { ArrowLeft, Download, MessageSquareText } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { FinalPdfUpload } from './final-pdf-upload';
import { AiReviewPanel } from '@/components/ai-review-panel';

export const dynamic = 'force-dynamic';

type Preprint = {
  id: string; title: string; titleEn: string | null; authorName: string;
  affiliation: string | null; category: string; abstract: string;
  abstractEn: string | null; keywords: string | null; status: string; createdAt: string;
  submitterUserId: string; submissionChannel: string; finalName: string | null;
};
type Review = {
  id: string; reviewerName: string; recommendation: string; scores: Array<number | null>;
  academicStrengths: string; requiredRevisions: string; otherSuggestions: string; createdAt: string;
};

const recommendationLabels: Record<string, string> = {
  accept: '直接推薦', minor_revision: '修正後推薦',
  major_revision: '重大修正後再審', reject: '不予推薦',
};
const scoreLabels = ['主題契合', '學術貢獻', '理論文獻', '方法論證', '結構表達', '引註倫理'];

export default async function PreprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [preprints, currentUser] = await Promise.all([
    query<Preprint>(`SELECT id,title,title_en AS "titleEn",author_name AS "authorName",
    affiliation,category,abstract,abstract_en AS "abstractEn",keywords,status,created_at AS "createdAt",
    submitter_user_id AS "submitterUserId", submission_channel AS "submissionChannel", final_name AS "finalName"
    FROM submissions WHERE id=$1 AND status <> 'rejected'`, [id]),
    getCurrentUser(),
  ]);
  const preprint = preprints.rows[0];
  if (!preprint) notFound();
  const reviewRows = await query(`SELECT id,reviewer_name AS "reviewerName",recommendation,
    ARRAY[score_relevance,score_contribution,score_literature,score_method,score_structure,score_ethics] AS scores,
    academic_strengths AS "academicStrengths",required_revisions AS "requiredRevisions",
    other_suggestions AS "otherSuggestions",created_at AS "createdAt"
    FROM reviews WHERE submission_id=$1 ORDER BY created_at`, [id]);
  const reviews = reviewRows.rows as Review[];

  return (
    <main>
      <SiteHeader />
      <article className="article-page preprint-page">
        <a className="back-link" href="/articles"><ArrowLeft /> 返回預印本與文章</a>
        <div className="article-title-block">
          <p className="article-type">{preprint.category} · PREPRINT · {preprint.status === 'published' ? '已正式出版' : '公開審查中'}</p>
          <h1>{preprint.title}</h1>
          {preprint.titleEn && <p className="article-title-en">{preprint.titleEn}</p>}
          <p className="article-byline">{preprint.authorName}</p>
          {preprint.affiliation && <p className="article-affiliation">{preprint.affiliation}</p>}
        </div>
        <div className="article-layout">
          <div className="article-content">
            <section><h2>摘要</h2><p>{preprint.abstract}</p></section>
            {preprint.abstractEn && <section><h2>Abstract</h2><p className="abstract-en">{preprint.abstractEn}</p></section>}
            <section><h2>關鍵字</h2><div className="keyword-row">{(preprint.keywords ?? '').split(/[、,]/).filter(Boolean).map((keyword) => <span key={keyword}>{keyword.trim()}</span>)}</div></section>
            {currentUser?.id === preprint.submitterUserId && <AiReviewPanel submissionId={preprint.id} context="author" />}
            <section className="public-reviews">
              <h2>公開審查紀錄</h2>
              {reviews.length ? reviews.map((review) => {
                const scored = review.scores.filter((score): score is number => score !== null);
                const avg = scored.length ? (scored.reduce((sum, score) => sum + score, 0) / scored.length).toFixed(1) : '—';
                return <article key={review.id}>
                  <header><div><b>{review.reviewerName}</b><span>公開審查人 · 平均 {avg}</span></div><strong>{recommendationLabels[review.recommendation]}</strong></header>
                  <div className="published-scores">{review.scores.map((score, index) => <span key={scoreLabels[index]}>{scoreLabels[index]} <b>{score ?? 'N/A'}</b></span>)}</div>
                  <h3>學術優點</h3><p>{review.academicStrengths}</p>
                  <h3>必要修改</h3><p>{review.requiredRevisions}</p>
                  {review.otherSuggestions && <><h3>其他建議</h3><p>{review.otherSuggestions}</p></>}
                  <small>{new Date(review.createdAt).toLocaleDateString('zh-TW')}</small>
                </article>;
              }) : <div className="no-reviews"><MessageSquareText /><p><b>尚無審查意見</b><br />本稿正在徵求具相關專長的會員審查。</p></div>}
            </section>
          </div>
          <aside className="article-aside">
            <p><b>公開版本紀錄</b></p>
            <dl><dt>稿件編號</dt><dd>{preprint.id}</dd><dt>提交日期</dt><dd>{new Date(preprint.createdAt).toLocaleDateString('zh-TW')}</dd><dt>投稿管道</dt><dd>{preprint.submissionChannel === 'assisted_email' ? '編輯部協助登錄' : '會員線上投稿'}</dd><dt>狀態</dt><dd>{preprint.status === 'published' ? '正式出版' : '公開審查'}</dd><dt>審查</dt><dd>{reviews.length} 份公開意見</dd><dt>授權</dt><dd>CC BY 4.0</dd></dl>
            <Button nativeButton={false} render={<a href={`/api/manuscripts/${preprint.id}`} />} className="download-button"><Download /> 下載預印本 PDF</Button>
            {preprint.status === 'published' && preprint.finalName && <Button nativeButton={false} render={<a href={`/api/manuscripts/${preprint.id}?version=final`} />} className="download-button"><Download /> 下載正式 PDF</Button>}
            {currentUser?.id === preprint.submitterUserId && ['accepted', 'published'].includes(preprint.status) && <FinalPdfUpload submissionId={preprint.id} existingName={preprint.finalName} />}
            {preprint.status !== 'published' && <Button nativeButton={false} render={<a href="/review" />} variant="outline"><MessageSquareText /> 參與審查</Button>}
          </aside>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
