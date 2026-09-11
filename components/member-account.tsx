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
  const workspace = role === 'assistant_editor'
    ? { href: '/assistant-editor', label: '助理編輯台' }
    : ['editor', 'editor_in_chief'].includes(role)
      ? { href: '/editor', label: '編輯台' }
      : null;
  return <div className="member-account"><small>{name}</small>{workspace && <a href={workspace.href}>{workspace.label}</a>}<button type="button" onClick={logout} disabled={busy}>{busy ? '登出中' : '登出'}</button></div>;
}
