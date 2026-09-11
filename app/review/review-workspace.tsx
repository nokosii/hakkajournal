'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, Check, FileText, LoaderCircle, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Submission = {
  id: string;
  title: string;
  authorName: string;
  affiliation: string | null;
  category: string;
  abstract: string;
  keywords: string | null;
  status: string;
  reviewCount: number;
};

export function ReviewWorkspace({ reviewerName }: { reviewerName: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [recommendation, setRecommendation] = useState('minor-revision');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selected = submissions.find((item) => item.id === selectedId);

  useEffect(() => {
    fetch('/api/submissions')
      .then(async (response) => {
        const result = await response.json() as { submissions?: Submission[]; error?: string };
        if (!response.ok) throw new Error(result.error || '無法載入稿件。');
        const items = result.submissions ?? [];
        setSubmissions(items);
        setSelectedId(items[0]?.id ?? '');
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : '無法載入稿件。'))
      .finally(() => setLoading(false));
  }, []);

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError('');
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: selected.id, recommendation, authorComments: formData.get('authorComments'), conflictConfirmed: formData.get('conflictConfirmed') === 'on' }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '儲存失敗，請稍後再試。');
      setSaved(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '儲存失敗。'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="review-success"><LoaderCircle className="spin" /><h2>載入公開稿件</h2></div>;
  if (!submissions.length) return <div className="review-success"><BookOpen /><h2>目前沒有待審稿件</h2><p>新預印本通過範圍檢核後，將在此開放所有會員參與審查。</p></div>;
  if (saved) return <div className="review-success"><span><Check /></span><h2>公開審查意見已送出</h2><p>感謝 {reviewerName} 完成稿件 {selectedId} 的審查。您的姓名、建議與意見將收錄於公開評議紀錄。</p><Button onClick={() => setSaved(false)}>繼續審閱其他稿件</Button></div>;

  return (
    <div className="review-grid open-review-grid">
      <aside className="manuscript-card review-queue">
        <p className="article-type">OPEN CALL FOR REVIEWERS</p>
        <h2>開放審查稿件</h2>
        <p className="queue-intro">請選擇符合您專長、且無利益衝突的預印本。</p>
        <div className="queue-list">
          {submissions.map((item) => <button type="button" key={item.id} className={selectedId === item.id ? 'selected' : ''} onClick={() => { setSelectedId(item.id); setSaved(false); }}><span>{item.category} · {item.reviewCount} 份審查</span><b>{item.title}</b><small>{item.authorName}</small></button>)}
        </div>
      </aside>

      {selected && <form className="review-form" onSubmit={saveReview}>
        <div className="review-form-head"><FileText /><div><p className="article-type">{selected.category} · PREPRINT</p><h2>{selected.title}</h2><p>{selected.authorName}{selected.affiliation ? ` · ${selected.affiliation}` : ''}</p></div></div>
        <section className="review-abstract"><b>摘要</b><p>{selected.abstract}</p>{selected.keywords && <small>關鍵字：{selected.keywords}</small>}</section>
        <fieldset><legend>總體建議 *</legend><div className="recommendations">{[['accept','推薦發表'],['minor-revision','小幅修改'],['major-revision','大幅修改'],['reject','不予推薦']].map(([value,label]) => <label key={value} className={recommendation === value ? 'selected' : ''}><input type="radio" name="recommendation" value={value} checked={recommendation === value} onChange={() => setRecommendation(value)} />{label}</label>)}</div></fieldset>
        <label><span>公開審查意見 *</span><Textarea name="authorComments" required minLength={80} placeholder="請就研究問題、方法、論證、資料倫理與學術貢獻提供具體且可回應的建議……" /></label>
        <label className="declaration review-declaration"><input type="checkbox" name="conflictConfirmed" required /><span>我確認具備審查本稿的相關專長、沒有未揭露的利益衝突，並同意以「{reviewerName}」公開此份審查。</span></label>
        <div className="open-review-note"><Scale /><p><b>公開與可引用</b><br />審查意見一經送出即成為學術紀錄。必要的個資、私密資料或人身評論請勿寫入。</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="review-actions"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> 送出中</> : <><Users /> 公開送出審查</>}</Button></div>
      </form>}
    </div>
  );
}
