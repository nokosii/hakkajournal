'use client';

import { type FormEvent, useState } from 'react';
import { LoaderCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function MessageBoardForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: data.get('subject'), message: data.get('message') }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '留言送出失敗。');
      form.reset(); window.location.reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : '留言送出失敗。'); setSubmitting(false); }
  }
  return <form className="message-board-form" onSubmit={submit}><h2>留下訊息</h2><p>可詢問投稿、審查、數位材料或期刊使用問題。留言與會員顯示名稱將公開。</p><label><span>主旨 *</span><Input name="subject" required minLength={2} maxLength={80} /></label><label><span>內容 *</span><Textarea name="message" required minLength={10} maxLength={1000} /></label>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" /> 送出中</> : <><Send /> 發布留言</>}</Button></form>;
}
