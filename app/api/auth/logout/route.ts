import { assertSameOrigin, clearSession } from '@/lib/auth';

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return Response.json({ error: '請重新整理頁面後再試。' }, { status: 403 }); }
  await clearSession();
  return Response.json({ ok: true });
}
