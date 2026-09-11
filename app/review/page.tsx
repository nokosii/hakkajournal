import type { Metadata } from 'next';
import { UserCheck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ReviewWorkspace } from './review-workspace';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: '公開審查｜客家與數位人文期刊', description: '依專長檢視客家研究的材料、論證、數位方法與資料倫理，留下可閱讀、可引用的公開審查。' };
export const dynamic = 'force-dynamic';
export default async function ReviewPage() {
  const user = await requireUser('/review');
  return <main><SiteHeader /><section className="review-hero"><div><p className="eyebrow">OPEN PEER REVIEW</p><h1>公開審查</h1><p>審查不只判定是否刊登，也協助作者釐清材料、理論、數位方法、資料權利與社群倫理。所有註冊會員皆可依專長參與；具名意見將成為可閱讀、可引用的研究紀錄。</p></div><span><UserCheck /> 已登入會員：{user.displayName}</span></section><section className="review-section"><ReviewWorkspace reviewerName={user.displayName} /></section><SiteFooter /></main>;
}
