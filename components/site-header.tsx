import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '@/app/chatgpt-auth';

export async function SiteHeader() {
  const user = await getChatGPTUser();
  return (
    <>
      <div className="topline" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="客家與數位人文期刊首頁">
          <span className="brand-mark" aria-hidden="true"><b>客</b></span>
          <span><strong>客家與數位人文期刊</strong><small>Journal of Hakka and Digital Humanities</small></span>
        </a>
        <nav aria-label="主要導覽"><a href="/articles">預印本與推薦</a><a href="/#about">運作方式</a><a href="/#editorial">編輯團隊</a><a href="/review">公開審查</a></nav>
        {user ? (
          <div className="member-account"><small>{user.displayName}</small><a href={chatGPTSignOutPath('/')} target="_top">登出</a></div>
        ) : (
          <Button nativeButton={false} render={<a href={chatGPTSignInPath('/')} target="_top" />} className="header-cta">會員登入 <ArrowRight /></Button>
        )}
      </header>
    </>
  );
}
