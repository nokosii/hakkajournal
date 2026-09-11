import { redirect } from 'next/navigation';
import { AuthForm } from '@/app/auth-form';
import { getCurrentUser } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  if (await getCurrentUser()) redirect('/');
  const { returnTo = '/' } = await searchParams;
  return <main><SiteHeader /><section className="auth-page"><div className="auth-copy"><p className="eyebrow">JOIN THE COMMUNITY</p><h1>註冊會員</h1><p>所有會員都能投稿與審稿。審查人可選擇具名或匿名公開意見；會員真實身分仍由編輯部留存管理。</p></div><div><AuthForm mode="register" returnTo={returnTo} /><p className="auth-switch">已經有帳號？<a href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>會員登入</a></p><p className="auth-switch">受邀或無法使用會員系統？<a href="/special-submission">查看特殊作者 EMAIL 投稿</a></p></div></section><SiteFooter /></main>;
}
