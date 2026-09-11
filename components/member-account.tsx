'use client';

import { useState } from 'react';

export function MemberAccount({ name, editor }: { name: string; editor: boolean }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  return <div className="member-account"><small>{name}</small>{editor && <a href="/editor">編輯台</a>}<button type="button" onClick={logout} disabled={busy}>{busy ? '登出中' : '登出'}</button></div>;
}
