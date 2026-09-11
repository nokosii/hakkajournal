'use client';

import { FormEvent, useState } from 'react';
import { Check, FileUp, LoaderCircle, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function SubmissionForm({ memberName, memberEmail }: { memberName: string; memberEmail: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionId, setSubmissionId] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      const response = await fetch('/api/submissions', { method: 'POST', body: new FormData(event.currentTarget) });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error || '投稿送出失敗，請稍後重試。');
      setSubmissionId(result.id ?? '');
    } catch (caught) { setError(caught instanceof Error ? caught.message : '投稿送出失敗。'); }
    finally { setSubmitting(false); }
  }

  if (submissionId) return (
    <div className="submission-success"><span><Check /></span><p className="eyebrow">SUBMISSION RECEIVED</p><h2>稿件已成功送達編輯部</h2><p>您的稿件編號為</p><strong>{submissionId}</strong><p>系統已建立投稿紀錄。編輯部完成格式檢核後，將以電子郵件通知後續進度。</p><Button onClick={() => { setSubmissionId(''); setError(''); }}>再投一篇稿件</Button></div>
  );

  return (
    <form className="submission-form" onSubmit={onSubmit}>
      <section className="form-section"><div className="form-number">01</div><div><h2>稿件資訊</h2><p>請提供中英文題名與文章類型。</p></div>
        <div className="field-grid"><label className="full-field"><span>中文題名 *</span><Input name="title" required placeholder="請輸入完整中文題名" /></label><label className="full-field"><span>英文題名</span><Input name="titleEn" placeholder="English article title" /></label><label><span>文章類型 *</span><select name="category" required defaultValue=""><option value="" disabled>請選擇</option><option>研究論文</option><option>數位方法</option><option>研究紀要</option><option>評論／書評</option></select></label><label><span>關鍵字</span><Input name="keywords" placeholder="以頓號分隔，至多 5 組" /></label><label className="full-field"><span>中文摘要 *</span><Textarea name="abstract" required minLength={80} placeholder="建議 300–500 字，請勿放入可識別作者身分的資訊" /></label></div>
      </section>
      <section className="form-section"><div className="form-number">02</div><div><h2>作者資訊</h2><p>通訊作者由目前登入的會員帳號帶入；姓名將與預印本公開。</p></div>
        <div className="field-grid"><label><span>通訊作者姓名 *</span><Input name="authorName" required defaultValue={memberName} /></label><label><span>電子郵件 *</span><Input name="email" type="email" required defaultValue={memberEmail} readOnly /></label><label className="full-field"><span>服務單位</span><Input name="affiliation" placeholder="學校／機構、系所與職稱" /></label></div>
      </section>
      <section className="form-section"><div className="form-number">03</div><div><h2>預印本上傳與公開聲明</h2><p>請上傳可供社群閱讀與審查的版本。</p></div>
        <label className="upload-zone"><FileUp /><b>選擇預印本檔案 *</b><span>接受 PDF、DOC、DOCX，檔案上限 20 MB</span><Input name="manuscript" type="file" accept=".pdf,.doc,.docx" required /></label>
        <label className="declaration"><input type="checkbox" name="openReviewConsent" required /><span>本人確認稿件未一稿多投，並同意公開作者身分、預印本、審查意見、作者回覆與編輯推薦紀錄。</span></label>
      </section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-submit"><div><b>送出前請再次確認</b><p>送出後將產生稿件編號，檔案與資料會安全保存。</p></div><Button type="submit" size="lg" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" /> 正在送出</> : <><Send /> 正式送出稿件</>}</Button></div>
    </form>
  );
}
