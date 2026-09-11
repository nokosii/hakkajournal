'use client';

import { FormEvent, useState } from 'react';
import { Check, FileUp, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FinalPdfUpload({ submissionId, existingName }: { submissionId: string; existingName: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true); setMessage(''); setError('');
    const form = event.currentTarget;
    const response = await fetch(`/api/submissions/${submissionId}/final-pdf`, { method: 'POST', body: new FormData(form) });
    const result = await response.json() as { name?: string; error?: string };
    if (response.ok) {
      setMessage(`${result.name ?? '最終版本'}已上傳。`);
      form.reset();
      window.location.reload();
    } else {
      setError(result.error || '最終版本上傳失敗。');
      setUploading(false);
    }
  }

  return <form className="final-pdf-upload" onSubmit={upload}>
    <div><b><FileUp /> 作者最終版本</b><p>{existingName ? `目前檔案：${existingName}` : '稿件已接受，請上傳排版完成的 PDF。'}</p></div>
    <Input name="finalPdf" type="file" accept="application/pdf,.pdf" required />
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="form-success"><Check /> {message}</p>}
    <Button type="submit" disabled={uploading}>{uploading ? <><LoaderCircle className="spin" /> 上傳中</> : <><FileUp /> {existingName ? '更新最終 PDF' : '上傳最終 PDF'}</>}</Button>
  </form>;
}
