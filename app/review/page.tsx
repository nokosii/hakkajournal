import type { Metadata } from 'next';
import { UserCheck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ReviewWorkspace } from './review-workspace';
import { requireChatGPTUser } from '@/app/chatgpt-auth';

export const metadata: Metadata = { title: '公開審查｜客家與數位人文期刊', description: '註冊會員可依專長參與公開同儕審查。' };
export const dynamic = 'force-dynamic';
export default async function ReviewPage() {
  const user = await requireChatGPTUser('/review');
  return <main><SiteHeader /><section className="review-hero"><div><p className="eyebrow">OPEN PEER REVIEW</p><h1>公開審查</h1><p>所有註冊會員皆可依專長參與；您的姓名、意見與建議將隨評議紀錄公開。</p></div><span><UserCheck /> 已登入會員：{user.displayName}</span></section><section className="review-section"><ReviewWorkspace reviewerName={user.displayName} /></section><SiteFooter /></main>;
}
