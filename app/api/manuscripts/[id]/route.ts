import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

type Manuscript = { preprintData: Buffer; preprintName: string; preprintType: string };
type FinalManuscript = { submitterUserId: string; status: string; finalData: Buffer | null; finalName: string | null; finalType: string | null };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (new URL(request.url).searchParams.get('version') === 'final') {
    const result = await query<FinalManuscript>(`SELECT submitter_user_id AS "submitterUserId", status,
      final_data AS "finalData", final_name AS "finalName", final_type AS "finalType"
      FROM submissions WHERE id = $1`, [id]);
    const record = result.rows[0];
    if (!record?.finalData || !record.finalName) return Response.json({ error: '最終 PDF 尚未上傳。' }, { status: 404 });
    if (record.status !== 'published') {
      const user = await getCurrentUser();
      if (!user || (user.id !== record.submitterUserId && user.role !== 'editor' && user.role !== 'editor_in_chief')) {
        return Response.json({ error: '最終 PDF 尚未公開。' }, { status: 403 });
      }
    }
    return new Response(new Uint8Array(record.finalData), { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.finalName)}` } });
  }

  const result = await query<Manuscript>('SELECT preprint_data AS "preprintData", preprint_name AS "preprintName", preprint_type AS "preprintType" FROM submissions WHERE id = $1', [id]);
  const record = result.rows[0];
  if (!record) return Response.json({ error: '找不到預印本。' }, { status: 404 });
  return new Response(new Uint8Array(record.preprintData), { headers: { 'content-type': record.preprintType, 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.preprintName)}` } });
}
