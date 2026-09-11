'use client';

import { type FormEvent, useState } from 'react';
import { Check, LoaderCircle, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function AuthorResponseForm({ reviewId, existingResponse }: { reviewId: string; existingResponse: string | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false);
    const responseText = String(new FormData(event.currentTarget).get('responseText') ?? '').trim();
    try {
      const response = await fetch(`/api/reviews/${reviewId}/response`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ responseText }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '回應儲存失敗。');
      setSaved(true); window.location.reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : '回應儲存失敗。'); setSaving(false); }
  }

  return <form className="author-response-form" onSubmit={submit}><label><span>{existingResponse ? '更新作者回應' : '回應這份審查意見'}</span><Textarea name="responseText" defaultValue={existingResponse ?? ''} minLength={20} required placeholder="逐項說明已採納、修正或仍需討論之處；回應將與審查意見一併公開。" /></label>{error && <p className="form-error" role="alert">{error}</p>}{saved && <p className="form-success"><Check /> 回應已儲存。</p>}<Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> 儲存中</> : <><MessageSquareReply /> {existingResponse ? '更新公開回應' : '發布公開回應'}</>}</Button></form>;
}
