'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, FileText, LoaderCircle, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Submission = { id: string; title: string; authorName: string; affiliation: string | null; category: string; abstract: string; keywords: string | null; status: string; reviewCount: number };
type ScoreKey = 'scoreRelevance' | 'scoreContribution' | 'scoreLiterature' | 'scoreMethod' | 'scoreStructure' | 'scoreEthics';
const criteria: Array<{ key: ScoreKey; code: string; title: string; help: string }> = [
  { key: 'scoreRelevance', code: 'A', title: '主題契合與客家研究關聯', help: '是否回應本刊範圍，清楚呈現客家研究或數位人文意義。' },
  { key: 'scoreContribution', code: 'B', title: '學術貢獻與原創性', help: '是否提出新問題、觀點、材料、整合或實務反思，並交代知識貢獻。' },
  { key: 'scoreLiterature', code: 'C', title: '概念、理論與文獻', help: '核心概念是否清楚，文獻是否適切，學術對話脈絡是否充分。' },
  { key: 'scoreMethod', code: 'D', title: '方法、材料與論證', help: '材料選擇、方法或詮釋程序、證據與推論界線是否合宜。' },
  { key: 'scoreStructure', code: 'E', title: '篇章結構與表達', help: '題名、目的、組織與論述是否一致，文字、圖表是否清晰。' },
  { key: 'scoreEthics', code: 'F', title: '引註與倫理規範', help: '引註、圖文授權、研究倫理與文化知識使用是否妥適。' },
];
const initialScores = Object.fromEntries(criteria.map(({ key }) => [key, ''])) as Record<ScoreKey, string>;

export function ReviewWorkspace({ reviewerName }: { reviewerName: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [scores, setScores] = useState(initialScores);
  const [recommendation, setRecommendation] = useState('minor_revision');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selected = submissions.find((item) => item.id === selectedId);
  const average = useMemo(() => {
    const values = Object.values(scores).filter((value) => value && value !== 'na').map(Number);
    return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : '—';
  }, [scores]);

  useEffect(() => {
    fetch('/api/submissions').then(async (response) => {
      const result = await response.json() as { submissions?: Submission[]; error?: string };
      if (!response.ok) throw new Error(result.error || '無法載入稿件。');
      const items = (result.submissions ?? []).filter((item) => ['open_review', 'revision'].includes(item.status));
      setSubmissions(items); setSelectedId(items[0]?.id ?? '');
    }).catch((caught) => setError(caught instanceof Error ? caught.message : '無法載入稿件。')).finally(() => setLoading(false));
  }, []);

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ submissionId: selected.id, recommendation, ...scores, academicStrengths: form.get('academicStrengths'), requiredRevisions: form.get('requiredRevisions'), otherSuggestions: form.get('otherSuggestions'), conflictConfirmed: form.get('conflictConfirmed') === 'on' }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '儲存失敗，請稍後再試。');
      setSaved(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '儲存失敗。'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="review-success"><LoaderCircle className="spin" /><h2>載入公開稿件</h2></div>;
  if (!submissions.length) return <div className="review-success"><BookOpen /><h2>目前沒有待審稿件</h2><p>新預印本發布後，會在此開放所有會員參與審查。</p></div>;
  if (saved) return <div className="review-success"><span><Check /></span><h2>正式審查表已送出</h2><p>感謝 {reviewerName} 完成稿件 {selectedId} 的公開審查。六項評分與文字意見已保存。</p><Button onClick={() => { setSaved(false); setScores(initialScores); }}>審閱其他稿件</Button></div>;

  return <div className="review-grid open-review-grid">
    <aside className="manuscript-card review-queue"><p className="article-type">OPEN CALL FOR REVIEWERS</p><h2>開放審查稿件</h2><p className="queue-intro">請選擇符合您專長、且無利益衝突的預印本。</p><div className="queue-list">{submissions.map((item) => <button type="button" key={item.id} className={selectedId === item.id ? 'selected' : ''} onClick={() => { setSelectedId(item.id); setSaved(false); setScores(initialScores); }}><span>{item.category} · {item.reviewCount} 份審查</span><b>{item.title}</b><small>{item.authorName}</small></button>)}</div></aside>
    {selected && <form className="review-form formal-review-form" onSubmit={saveReview}>
      <div className="review-form-head"><FileText /><div><p className="article-type">{selected.category} · PREPRINT</p><h2>{selected.title}</h2><p>{selected.authorName}{selected.affiliation ? ` · ${selected.affiliation}` : ''}</p></div></div>
      <section className="review-abstract"><b>摘要</b><p>{selected.abstract}</p>{selected.keywords && <small>關鍵字：{selected.keywords}</small>}<a href={`/api/manuscripts/${selected.id}`}>下載預印本全文</a></section>
      <section className="score-section"><div className="score-heading"><div><h3>逐項評分</h3><p>5 優良、4 良好、3 尚可、2 待加強、1 需根本修正；不適用請選 N/A。</p></div><strong>平均 {average}</strong></div>
        <div className="score-table" role="table" aria-label="期刊審查評分表">
          <div className="score-row score-header" role="row"><span>面向</span><span>評分</span></div>
          {criteria.map((criterion) => <div className="score-row" role="row" key={criterion.key}><div><b><i>{criterion.code}</i>{criterion.title}</b><small>{criterion.help}</small></div><div className="score-options">{['5','4','3','2','1','na'].map((value) => <label key={value} className={scores[criterion.key] === value ? 'selected' : ''}><input type="radio" name={criterion.key} value={value} checked={scores[criterion.key] === value} onChange={() => setScores((current) => ({ ...current, [criterion.key]: value }))} />{value === 'na' ? 'N/A' : value}</label>)}</div></div>)}
        </div>
      </section>
      <label><span>學術優點 *</span><Textarea name="academicStrengths" required minLength={40} placeholder="說明本稿的問題意識、材料、方法與學術貢獻……" /></label>
      <label><span>必要修改（請標示頁碼／段落）*</span><Textarea name="requiredRevisions" required minLength={40} placeholder="逐項列出作者必須回應的問題，並盡量註明頁碼或段落……" /></label>
      <label><span>其他建議／N/A 說明</span><Textarea name="otherSuggestions" placeholder="選擇 N/A 的原因，或其他不影響判定的建議……" /></label>
      <fieldset><legend>總體判定 *</legend><div className="recommendations">{[['accept','直接推薦'],['minor_revision','修正後推薦'],['major_revision','重大修正後再審'],['reject','不予推薦']].map(([value,label]) => <label key={value} className={recommendation === value ? 'selected' : ''}><input type="radio" name="recommendation" value={value} checked={recommendation === value} onChange={() => setRecommendation(value)} />{label}</label>)}</div></fieldset>
      <label className="declaration review-declaration"><input type="checkbox" name="conflictConfirmed" required /><span>我確認具備相關專長、沒有未揭露的利益衝突，並同意以「{reviewerName}」公開此份審查。</span></label>
      <div className="open-review-note"><Scale /><p><b>正式公開紀錄</b><br />評分與意見送出後即成為可引用的學術紀錄，請保持具體、尊重且可回應。</p></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="review-actions"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> 送出中</> : <><Users /> 正式送出審查表</>}</Button></div>
    </form>}
  </div>;
}
