import { env } from 'cloudflare:workers';

type ManuscriptRecord = { manuscriptKey: string; manuscriptName: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await env.DB.prepare('SELECT manuscript_key AS manuscriptKey, manuscript_name AS manuscriptName FROM submissions WHERE id = ?').bind(id).first<ManuscriptRecord>();
  if (!record) return Response.json({ error: '找不到預印本。' }, { status: 404 });
  const object = await env.UPLOADS.get(record.manuscriptKey);
  if (!object) return Response.json({ error: '預印本檔案不存在。' }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(record.manuscriptName)}`);
  return new Response(object.body, { headers });
}
