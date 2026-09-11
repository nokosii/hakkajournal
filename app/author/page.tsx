import type { Metadata } from 'next';
import { ArrowRight, BookOpenText, FilePlus2, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata: Metadata = { title: '作者工作台｜客家與數位人文期刊' };
export const dynamic = 'force-dynamic';

type AuthorSubmission = {
  id: string; title: string; category: string; status: string; createdAt: string | Date;
};

const statusLabels: Record<string, string> = {
  open_review: '公開審查中', revision: '修訂中', accepted: '接受刊登', published: '正式發布', rejected: '不予刊登',
};

export default async function AuthorPage() {
  const user = await requireUser('/author');
  const result = await query<AuthorSubmission>(`SELECT id,title,category,status,created_at AS "createdAt"
    FROM submissions WHERE submitter_user_id = $1 ORDER BY created_at DESC`, [user.id]);
  return <main><SiteHeader /><section className="review-hero author-hero"><div><p className="eyebrow">AUTHOR WORKSPACE</p><h1>作者工作台</h1><p>追蹤稿件、閱讀並回應審查意見，以及上傳 PDF 修正版本。</p></div><span><BookOpenText /> 作者 · {user.displayName}</span></section><section className="author-workspace"><div className="author-workspace-head"><div><p className="eyebrow">MY SUBMISSIONS</p><h2>我的稿件</h2></div><Button nativeButton={false} render={<a href="/submit" />}><FilePlus2 /> 提交新預印本</Button></div>{result.rows.length ? <div className="author-submission-list">{result.rows.map((submission) => <article key={submission.id}><div><span>{submission.category} · {submission.id}</span><h3>{submission.title}</h3><p>{new Date(submission.createdAt).toLocaleDateString('zh-TW')} · {statusLabels[submission.status] ?? submission.status}</p></div><a href={`/preprints/${submission.id}`}><MessageSquareReply /> 查看審查、回應與修正稿 <ArrowRight /></a></article>)}</div> : <div className="empty-state author-empty"><BookOpenText /><h2>尚未投稿</h2><p>提交第一份 PDF 預印本後，稿件與審查進度會顯示在這裡。</p><Button nativeButton={false} render={<a href="/submit" />}>開始投稿</Button></div>}</section><SiteFooter /></main>;
}
