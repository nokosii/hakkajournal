'use client';

import { useState } from 'react';
import type { UserRole } from '@/lib/auth';

export function MemberAccount({ name, role }: { name: string; role: UserRole }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  function switchWorkspace(href: string) {
    if (href) window.location.href = href;
  }
  return <div className="member-account"><small>{name}</small><label className="role-switcher"><span className="sr-only">切換工作角色</span><select aria-label="切換工作角色" defaultValue="" onChange={(event) => switchWorkspace(event.target.value)}><option value="" disabled>切換角色</option><option value="/author">作者</option><option value="/review">審稿者</option>{['assistant_editor', 'editor', 'editor_in_chief'].includes(role) && <option value="/assistant-editor">助理編輯</option>}{['editor', 'editor_in_chief'].includes(role) && <option value="/editor">編輯</option>}</select></label><button type="button" onClick={logout} disabled={busy}>{busy ? '登出中' : '登出'}</button></div>;
}
