import { loadDataset } from '@/lib/import/load-dataset';
import { loadRationales, saveRationale, RationaleConflict } from '@/lib/consensus/store';
import { rationaleRequestSchema } from '@/lib/consensus/rationales';
import { readLocalJson } from '@/lib/validation/request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const dataset = loadDataset();
    return Response.json(
      { fingerprint: dataset.fingerprint, records: loadRationales(dataset.fingerprint) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'Cannot load rationale records. Check the workbook or rationale store; no approval state has been inferred.',
      },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const input = rationaleRequestSchema.parse(await readLocalJson(request));
    const record = saveRationale(loadDataset(), input);
    return Response.json({ record });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to save rationale.' },
      { status: error instanceof RationaleConflict ? 409 : 400 },
    );
  }
}
