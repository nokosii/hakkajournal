import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { requireUser } from '@/lib/auth';
import { SubmissionForm } from './submission-form';

export const metadata: Metadata = {
  title: '提交預印本｜客家與數位人文期刊',
  description: '投稿客家歷史、語言、文化、社會與數位方法研究，發布預印本並接受公開同儕審查。',
};
export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const user = await requireUser('/submit');
  return (
    <main>
      <SiteHeader />
      <section className="page-hero submit-hero">
        <div><p className="eyebrow">MEMBER SUBMISSION</p><h1>提交預印本</h1><p>以可靠材料回應客家的歷史與當代變化，或用數位方法提出新的研究問題。註冊會員皆可投稿，稿件上傳後即進入公開同儕審查。</p></div>
        <ul><li><CheckCircle2 /> 全年徵稿</li><li><CheckCircle2 /> 公開同儕審查</li><li><CheckCircle2 /> 投稿與出版零費用</li></ul>
      </section>
      <section className="submission-layout">
        <aside className="submission-guide"><p className="eyebrow">BEFORE YOU START</p><h2>投稿前請準備</h2><ol><li><span>1</span>可公開閱讀的 PDF 預印本</li><li><span>2</span>清楚的研究問題、材料與方法</li><li><span>3</span>中英文題名、摘要與關鍵字</li></ol><p className="guide-note">研究論文以 8,000–20,000 字為原則。歡迎歷史、語言、文學、社會、文化、地方研究、數位典藏、資料分析與人工智慧等取徑。作者姓名、審查意見、回覆與推薦文字會隨流程公開。</p></aside>
        <SubmissionForm memberName={user.displayName} memberAffiliation={user.affiliation ?? ''} />
      </section>
      <SiteFooter />
    </main>
  );
}
