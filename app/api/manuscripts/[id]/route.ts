import { query } from '@/lib/db';

type Manuscript = { preprintData: Buffer; preprintName: string; preprintType: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await query<Manuscript>('SELECT preprint_data AS "preprintData", preprint_name AS "preprintName", preprint_type AS "preprintType" FROM submissions WHERE id = $1', [id]);
  const record = result.rows[0];
  if (!record) return Response.json({ error: '找不到預印本。' }, { status: 404 });
  return new Response(new Uint8Array(record.preprintData), { headers: { 'content-type': record.preprintType, 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.preprintName)}` } });
}
