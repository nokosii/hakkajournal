'use client';

import { type FormEvent, useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function RevisionUpload({ submissionId }: { submissionId: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setUploading(true); setError('');
    const response = await fetch(`/api/submissions/${submissionId}/revisions`, { method: 'POST', body: new FormData(event.currentTarget) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error || '修正稿上傳失敗。'); setUploading(false); return; }
    window.location.reload();
  }

  return <form className="revision-upload" onSubmit={upload}><div><b><FileUp /> 上傳修正稿件</b><p>僅接受 PDF。系統會保留舊版本、建立新的版本紀錄，並將 PDF 文字轉入最新版正文。</p></div><label><span>修正說明 *</span><Textarea name="changeSummary" minLength={10} required placeholder="簡要說明本次回應與主要修改內容……" /></label><Input name="revisionPdf" type="file" accept="application/pdf,.pdf" required />{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={uploading}>{uploading ? <><LoaderCircle className="spin" /> 上傳與轉換中</> : <><FileUp /> 上傳 PDF 修正稿</>}</Button></form>;
}
