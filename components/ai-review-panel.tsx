'use client';

import { Bot, CircleAlert, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type AiReview = {
  overview: string;
  strengths: string[];
  questions: string[];
  suggestions: string[];
  ethicsAndData: string;
};

export function AiReviewPanel({ submissionId, context }: { submissionId: string; context: 'author' | 'reviewer' }) {
  const [review, setReview] = useState<AiReview | null>(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateReview() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId, context }),
      });
      const result = await response.json() as { review?: AiReview; generatedAt?: string; error?: string };
      if (!response.ok || !result.review) throw new Error(result.error || '無法產生 AI 參考評閱。');
      setReview(result.review); setGeneratedAt(result.generatedAt ?? '');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法產生 AI 參考評閱。');
    } finally { setLoading(false); }
  }

  return <section className="ai-review-panel" aria-labelledby={`ai-review-${context}-${submissionId}`}>
    <div className="ai-review-heading">
      <Bot />
      <div><p className="eyebrow">AI REFERENCE REVIEW</p><h2 id={`ai-review-${context}-${submissionId}`}>AI 初步評閱</h2></div>
    </div>
    <div className="ai-review-boundary"><ShieldCheck /><p><b>僅供{context === 'author' ? '作者' : '審查人'}參考</b><br />不列入正式審查分數，也不作為接受、修正或拒絕稿件的依據。結果不會公開或寫入期刊紀錄。</p></div>
    {!review && <p className="ai-review-consent">按下按鈕後，系統會將由 PDF 擷取的稿件文字傳送至編輯部設定的 AI 服務，以產生一次性參考意見。</p>}
    {error && <p className="form-error" role="alert"><CircleAlert /> {error}</p>}
    {!review ? <Button type="button" onClick={generateReview} disabled={loading}>{loading ? <><LoaderCircle className="spin" /> AI 閱讀稿件中</> : <><Bot /> 產生 AI 參考評閱</>}</Button> : <div className="ai-review-result">
      <section><h3>內容概述</h3><p>{review.overview}</p></section>
      <section><h3>可延伸的優點</h3><ul>{review.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
      <section><h3>值得進一步釐清</h3><ul>{review.questions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
      <section><h3>具體修改建議</h3><ul>{review.suggestions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
      <section><h3>研究倫理與資料提醒</h3><p>{review.ethicsAndData}</p></section>
      <footer><span>{generatedAt ? `產生時間：${new Date(generatedAt).toLocaleString('zh-TW')}` : '本次工作階段產生'}</span><Button type="button" variant="outline" onClick={generateReview} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <RefreshCw />} 重新產生</Button></footer>
    </div>}
  </section>;
}
