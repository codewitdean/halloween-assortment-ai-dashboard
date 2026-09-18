import { loadDataset } from '@/lib/import/load-dataset';
import { loadRationales } from '@/lib/consensus/store';
import { querySchema, buildAnswer } from '@/lib/assistant/answer';
import { interpretQuestion } from '@/lib/assistant/provider';
import { readLocalJson } from '@/lib/validation/request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const input = querySchema.parse(await readLocalJson(request));
    const dataset = loadDataset();
    if (input.fingerprint !== dataset.fingerprint)
      return Response.json(
        { error: 'Workbook changed. Reload before asking about the consensus.' },
        { status: 409 },
      );
    if (input.productIds.some((id) => !dataset.products.some((p) => p.id === id)))
      return Response.json({ error: 'Unknown product.' }, { status: 400 });
    const routed = await interpretQuestion(input, dataset);
    let records = {};
    let storeNotice = '';
    try {
      records = loadRationales(dataset.fingerprint);
    } catch {
      storeNotice = ' Saved rationale status could not be loaded; no approved wording is quoted.';
    }
    return Response.json(
      {
        ...buildAnswer(dataset, routed.intent, records),
        mode: routed.mode,
        notice: routed.notice + storeNotice,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'Unable to answer. Check the request and validated workbook; no placement has been changed.',
      },
      { status: 400 },
    );
  }
}
