import type { Metadata } from 'next';
import { ArrowRight, FileText, Mail, MessagesSquare, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = { title: '特殊作者 EMAIL 投稿｜客家與數位人文期刊', description: '受邀作者或無法使用會員投稿系統者，可由編輯部助理編輯協助登錄 PDF 預印本並進入公開審查。' };

export default function SpecialSubmissionPage() {
  return <main>
    <SiteHeader />
    <section className="page-hero special-submission-hero"><p className="eyebrow">ASSISTED SUBMISSION</p><h1>特殊作者 EMAIL 投稿</h1><p>受邀作者或經編輯部同意採特殊方式投稿者，可將資料寄至公務信箱，由助理編輯協助登錄 PDF 預印本並送交公開審查。</p><Button nativeButton={false} render={<a href="mailto:hsc@nuu.edu.tw?subject=%E5%AE%A2%E5%AE%B6%E8%88%87%E6%95%B8%E4%BD%8D%E4%BA%BA%E6%96%87%E6%9C%9F%E5%88%8A%EF%BC%8D%E7%89%B9%E6%AE%8A%E4%BD%9C%E8%80%85%E6%8A%95%E7%A8%BF" />} className="primary-cta"><Mail /> 寄信至 hsc@nuu.edu.tw</Button></section>
    <section className="special-submission-process" aria-labelledby="special-process-title">
      <div className="section-heading"><div><p className="eyebrow">SUBMISSION PROCESS</p><h2 id="special-process-title">EMAIL 投稿流程</h2></div></div>
      <ol><li><span>01</span><FileText /><div><b>寄送 PDF 與作者資料</b><p>信中請列出中英文題名、摘要、關鍵字、作者姓名、服務單位及聯絡 EMAIL；附件僅接受 PDF。</p></div></li><li><span>02</span><UserRoundCheck /><div><b>助理編輯協助登錄</b><p>編輯部確認資料與公開審查同意後，建立稿件編號並發布預印本。</p></div></li><li><span>03</span><MessagesSquare /><div><b>進入公開審查</b><p>預印本、具名審查、修訂與推薦紀錄依期刊流程公開保存；後續聯繫與最終版本上傳由編輯部協助。</p></div></li></ol>
      <p className="special-submission-note">可自行使用系統的作者，請直接註冊會員並<a href="/submit">線上投稿 <ArrowRight /></a></p>
    </section>
    <SiteFooter />
  </main>;
}
