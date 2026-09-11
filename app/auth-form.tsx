'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AuthForm({ mode, returnTo = '/' }: { mode: 'login' | 'register'; returnTo?: string }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '操作失敗。');
      window.location.href = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
    } catch (caught) { setError(caught instanceof Error ? caught.message : '操作失敗。'); }
    finally { setLoading(false); }
  }

  const isRegister = mode === 'register';
  return <form className="auth-form" onSubmit={submit}>
    {isRegister && <><label><span>姓名 *</span><Input name="displayName" required minLength={2} autoComplete="name" /></label><label><span>服務單位</span><Input name="affiliation" autoComplete="organization" /></label><label><span>專長領域</span><Input name="expertise" placeholder="例如：客家文學、語料庫、數位典藏" /></label></>}
    <label><span>電子郵件 *</span><Input name="email" type="email" required autoComplete="email" /></label>
    <label><span>密碼 *</span><Input name="password" type="password" required minLength={12} autoComplete={isRegister ? 'new-password' : 'current-password'} /></label>
    {isRegister && <p className="form-hint">密碼至少 12 個字元。註冊後即可投稿與參與公開審查。</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" size="lg" disabled={loading}>{loading ? <><LoaderCircle className="spin" /> 處理中</> : isRegister ? <><UserPlus /> 建立會員帳號</> : <><LogIn /> 登入</>}</Button>
  </form>;
}
