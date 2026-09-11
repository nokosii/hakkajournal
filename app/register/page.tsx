import { redirect } from 'next/navigation';
import { AuthForm } from '@/app/auth-form';
import { getCurrentUser } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  if (await getCurrentUser()) redirect('/');
  const { returnTo = '/' } = await searchParams;
  return <main><SiteHeader /><section className="auth-page"><div className="auth-copy"><p className="eyebrow">JOIN THE COMMUNITY</p><h1>註冊會員</h1><p>所有會員都能投稿與審稿。公開審查以真實姓名呈現，請填寫可辨識的學術身分。</p></div><div><AuthForm mode="register" returnTo={returnTo} /><p className="auth-switch">已經有帳號？<a href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>會員登入</a></p></div></section><SiteFooter /></main>;
}
