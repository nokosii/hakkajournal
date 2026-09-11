import { redirect } from 'next/navigation';
import { AuthForm } from '@/app/auth-form';
import { getCurrentUser } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  if (await getCurrentUser()) redirect('/');
  const { returnTo = '/' } = await searchParams;
  return <main><SiteHeader /><section className="auth-page"><div className="auth-copy"><p className="eyebrow">MEMBER SIGN IN</p><h1>會員登入</h1><p>登入後即可投稿、審查預印本並追蹤自己的學術紀錄。</p></div><div><AuthForm mode="login" returnTo={returnTo} /><p className="auth-switch">還沒有帳號？<a href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>立即註冊</a></p></div></section><SiteFooter /></main>;
}
