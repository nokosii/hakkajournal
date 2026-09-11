'use client';

import { FormEvent, useMemo, useState } from 'react';
import { BookOpenCheck, Check, FilePenLine, FileUp, LoaderCircle, Plus, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type Submission = { id: string; title: string; titleEn: string | null; authorName: string; authorEmail: string | null; abstract: string; abstractEn: string | null; keywords: string | null; status: string; articleBody: string; pages: string | null; doi: string | null; finalName: string | null; issueId: string | null; editorNotes: string; submissionChannel: string; reviewCount: number; averageScore: number | null; createdAt: string };
export type Issue = { id: string; volume: number; number: number; year: number; title: string; description: string; status: string; publishedAt: string | null };
export type Member = { id: string; displayName: string; email: string; affiliation: string | null; expertise: string | null; role: string; createdAt: string };

export function EditorDashboard({ initialSubmissions, initialIssues, initialMembers }: { initialSubmissions: Submission[]; initialIssues: Issue[]; initialMembers: Member[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [issues, setIssues] = useState(initialIssues);
  const [members, setMembers] = useState(initialMembers);
  const [selectedId, setSelectedId] = useState(initialSubmissions[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => submissions.find((item) => item.id === selectedId), [submissions, selectedId]);

  async function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch('/api/issues', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json() as { id?: string; error?: string };
    if (response.ok && result.id) { setIssues((current) => [{ id: result.id!, volume: Number(payload.volume), number: Number(payload.number), year: Number(payload.year), title: String(payload.title), description: String(payload.description ?? ''), status: 'draft', publishedAt: null }, ...current]); event.currentTarget.reset(); setMessage('新卷期已建立。'); }
    else setMessage(result.error || '建立失敗。');
    setSaving(false);
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setMessage('');
    const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/editor/submissions/${selected.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    if (response.ok) { setSubmissions((current) => current.map((item) => item.id === selected.id ? { ...item, ...payload } as Submission : item)); setMessage(payload.status === 'published' ? '正式文章已發布。' : '稿件與文章內容已儲存。'); }
    else setMessage(result.error || '儲存失敗。');
    setSaving(false);
  }

  async function publishIssue(issue: Issue) {
    setSaving(true); setMessage('');
    const response = await fetch(`/api/issues/${issue.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'published' }) });
    const result = await response.json() as { error?: string };
    if (response.ok) { setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, status: 'published', publishedAt: new Date().toISOString() } : item)); setMessage(`第 ${issue.volume} 卷第 ${issue.number} 期已發布。`); }
    else setMessage(result.error || '發布失敗。');
    setSaving(false);
  }

  async function setMemberRole(member: Member, role: 'member' | 'assistant_editor' | 'editor') {
    setSaving(true); setMessage('');
    const response = await fetch('/api/editor/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: member.id, role }) });
    const result = await response.json() as { error?: string };
    if (response.ok) { setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role } : item)); setMessage(`${member.displayName} 的角色已更新。`); }
    else setMessage(result.error || '角色更新失敗。');
    setSaving(false);
  }

  return <section className="editor-dashboard">
    {message && <div className="editor-message" role="status"><Check /> {message}</div>}
    <div className="editor-quick-links"><Button nativeButton={false} render={<a href="/assistant-editor" />} variant="outline"><FileUp /> 特殊作者代投稿</Button></div>
    <div className="editor-columns">
      <aside className="editor-sidebar"><div className="editor-sidebar-head"><FilePenLine /><div><b>稿件與文章</b><span>{submissions.length} 筆</span></div></div>{submissions.map((item) => <button type="button" key={item.id} className={selectedId === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span>{item.status.replace('_', ' ')} · {item.reviewCount} 份審查{item.submissionChannel === 'assisted_email' ? ' · EMAIL 代投稿' : ''}</span><b>{item.title}</b><small>{item.authorName}{item.averageScore ? ` · 平均 ${item.averageScore}` : ''}</small></button>)}</aside>
      <div className="editor-main">
        {selected?.submissionChannel === 'assisted_email' && <p className="assisted-author-contact">EMAIL 代投稿 · 特殊作者聯絡信箱：<a href={`mailto:${selected.authorEmail}`}>{selected.authorEmail}</a></p>}
        {selected && <p className={selected.finalName ? 'final-file-ready' : 'final-file-missing'}>{selected.finalName ? `最終 PDF 已上傳：${selected.finalName}` : '作者尚未上傳最終 PDF；正式發布功能會維持鎖定。'}</p>}
        {selected ? <form className="editor-form" key={selected.id} onSubmit={saveArticle}><div className="editor-form-title"><div><p className="article-type">{selected.id}</p><h2>編輯稿件與正式文章</h2></div><a href={`/preprints/${selected.id}`} target="_blank">查看公開頁</a></div><div className="field-grid"><label className="full-field"><span>中文題名 *</span><Input name="title" defaultValue={selected.title} required /></label><label className="full-field"><span>英文題名</span><Input name="titleEn" defaultValue={selected.titleEn ?? ''} /></label><label className="full-field"><span>中文摘要 *</span><Textarea name="abstract" defaultValue={selected.abstract} required minLength={80} /></label><label className="full-field"><span>英文摘要</span><Textarea name="abstractEn" defaultValue={selected.abstractEn ?? ''} /></label><label className="full-field"><span>關鍵字</span><Input name="keywords" defaultValue={selected.keywords ?? ''} /></label><label className="full-field"><span>正式文章正文 *</span><Textarea className="article-body-input" name="articleBody" defaultValue={selected.articleBody} placeholder="輸入完成編輯的文章正文；空行會分成段落。" /></label><label><span>頁次</span><Input name="pages" defaultValue={selected.pages ?? ''} placeholder="1–24" /></label><label><span>DOI</span><Input name="doi" defaultValue={selected.doi ?? ''} /></label><label><span>所屬卷期</span><select name="issueId" defaultValue={selected.issueId ?? ''}><option value="">尚未編入</option>{issues.map((issue) => <option key={issue.id} value={issue.id}>第 {issue.volume} 卷第 {issue.number} 期 · {issue.title}</option>)}</select></label><label><span>稿件狀態</span><select name="status" defaultValue={selected.status}><option value="open_review">公開審查中</option><option value="revision">作者修訂中</option><option value="accepted">接受刊登</option><option value="published">正式發布</option><option value="rejected">不予刊登</option></select></label><label className="full-field"><span>編輯內部備註</span><Textarea name="editorNotes" defaultValue={selected.editorNotes} /></label></div><div className="review-actions"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> 儲存中</> : <><Send /> 儲存並套用狀態</>}</Button></div></form> : <div className="empty-state"><FilePenLine /><h2>尚無稿件</h2></div>}
      </div>
    </div>
    <section className="issue-manager"><div className="section-heading"><div><p className="eyebrow">ISSUE MANAGEMENT</p><h2>期刊卷期</h2></div></div><div className="issue-manager-grid"><form className="new-issue-form" onSubmit={createIssue}><h3><Plus /> 建立新卷期</h3><div className="field-grid"><label><span>卷 *</span><Input name="volume" type="number" min="1" required /></label><label><span>期 *</span><Input name="number" type="number" min="1" required /></label><label><span>年份 *</span><Input name="year" type="number" min="2000" defaultValue={new Date().getFullYear()} required /></label><label className="full-field"><span>本期題名 *</span><Input name="title" required /></label><label className="full-field"><span>本期說明</span><Textarea name="description" /></label></div><Button type="submit" disabled={saving}><Plus /> 建立草稿卷期</Button></form><div className="issue-admin-list">{issues.map((issue) => <article key={issue.id}><div><span>{issue.year} · VOL. {issue.volume} NO. {issue.number}</span><h3>{issue.title}</h3><p>{issue.description}</p></div><div><b className={`status-badge ${issue.status}`}>{issue.status === 'published' ? '已發布' : '草稿'}</b>{issue.status === 'draft' && <Button variant="outline" disabled={saving} onClick={() => publishIssue(issue)}><BookOpenCheck /> 發布本期</Button>}<a href={`/issues/${issue.id}`} target="_blank">預覽</a></div></article>)}</div></div></section>
    {members.length > 0 && <section className="member-manager"><div className="section-heading"><div><p className="eyebrow">MEMBER ROLES</p><h2>會員與編輯權限</h2></div><Users /></div><div className="member-admin-list">{members.map((member) => <article key={member.id}><div><b>{member.displayName}</b><span>{member.email}{member.affiliation ? ` · ${member.affiliation}` : ''}</span><small>{member.expertise || '尚未填寫專長'}</small></div><select aria-label={`設定 ${member.displayName} 的角色`} value={member.role} disabled={member.role === 'editor_in_chief' || saving} onChange={(event) => setMemberRole(member, event.target.value as 'member' | 'assistant_editor' | 'editor')}><option value="member">會員</option><option value="assistant_editor">助理編輯</option><option value="editor">編輯</option>{member.role === 'editor_in_chief' && <option value="editor_in_chief">主編</option>}</select></article>)}</div></section>}
  </section>;
}
