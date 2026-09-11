import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { requireUser } from '@/lib/auth';
import { SubmissionForm } from './submission-form';

export const metadata: Metadata = {
  title: '提交預印本｜客家與數位人文期刊',
  description: '會員線上提交並發布客家與數位人文研究預印本。',
};
export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const user = await requireUser('/submit');
  return (
    <main>
      <SiteHeader />
      <section className="page-hero submit-hero">
        <div><p className="eyebrow">MEMBER SUBMISSION</p><h1>提交預印本</h1><p>註冊會員皆可投稿；上傳完成後，稿件即進入公開同儕審查。</p></div>
        <ul><li><CheckCircle2 /> 全年徵稿</li><li><CheckCircle2 /> 公開同儕審查</li><li><CheckCircle2 /> 投稿與出版零費用</li></ul>
      </section>
      <section className="submission-layout">
        <aside className="submission-guide"><p className="eyebrow">BEFORE YOU START</p><h2>投稿前請準備</h2><ol><li><span>1</span>可公開閱讀的預印本</li><li><span>2</span>中英文題名與摘要</li><li><span>3</span>作者、服務單位與關鍵字</li></ol><p className="guide-note">研究論文以 8,000–20,000 字為原則。作者姓名、審查意見、回覆與推薦文字會隨流程公開。</p></aside>
        <SubmissionForm memberName={user.displayName} memberAffiliation={user.affiliation ?? ''} />
      </section>
      <SiteFooter />
    </main>
  );
}
