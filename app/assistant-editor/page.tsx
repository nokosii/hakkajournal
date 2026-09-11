import type { Metadata } from 'next';
import { FileUp, MessagesSquare, UserRoundCheck } from 'lucide-react';
import { requireAssistantEditor } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SubmissionForm } from '@/app/submit/submission-form';

export const metadata: Metadata = { title: '助理編輯工作台｜客家與數位人文期刊' };
export const dynamic = 'force-dynamic';

export default async function AssistantEditorPage() {
  const user = await requireAssistantEditor('/assistant-editor');
  const roleLabel = user.role === 'editor_in_chief' ? '主編' : user.role === 'editor' ? '編輯' : '助理編輯';
  return <main>
    <SiteHeader />
    <section className="review-hero assistant-editor-hero"><div><p className="eyebrow">ASSISTED EMAIL SUBMISSION</p><h1>特殊作者代投稿</h1><p>將編輯部信箱收到的 PDF 與作者資料登錄為公開預印本。送出後稿件立即進入公開審查，協助登錄者仍可審查其他非本人代投稿的稿件。</p></div><span><UserRoundCheck /> {roleLabel} · {user.displayName}</span></section>
    <section className="submission-layout assisted-submission-layout">
      <aside className="submission-guide"><p className="eyebrow">EDITORIAL CHECKLIST</p><h2>代投稿前確認</h2><ol><li><span>1</span>來稿為 PDF 且內容完整</li><li><span>2</span>作者姓名、EMAIL 與服務單位正確</li><li><span>3</span>作者已同意公開審查流程</li></ol><p className="guide-note"><FileUp /> 系統會保存原始 PDF 並轉為 Markdown 正文。<br /><a href="/review"><MessagesSquare /> 前往公開審查</a></p></aside>
      <SubmissionForm memberName="" memberAffiliation="" assisted />
    </section>
    <SiteFooter />
  </main>;
}
