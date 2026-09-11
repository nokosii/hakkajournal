import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { MemberAccount } from '@/components/member-account';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <>
      <div className="topline" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="客家與數位人文期刊首頁">
          <span className="brand-mark" aria-hidden="true"><b>客</b></span>
          <span><strong>客家與數位人文期刊</strong><small>Journal of Hakka and Digital Humanities</small></span>
        </a>
        <nav aria-label="主要導覽"><a href="/issues">期刊卷期</a><a href="/articles">預印本與文章</a><a href="/#editorial">編輯團隊</a><a href="/review">公開審查</a></nav>
        {user ? <MemberAccount name={user.displayName} editor={user.role !== 'member'} /> : <Button nativeButton={false} render={<a href="/login" />} className="header-cta">會員登入 <ArrowRight /></Button>}
      </header>
    </>
  );
}
