export async function readLocalJson(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Next's internal URL may use the bind address (0.0.0.0), while the browser
  // correctly uses localhost. Compare the browser origin to the HTTP Host.
  const host = request.headers.get('host') ?? url.host;
  if (origin && (new URL(origin).host !== host || new URL(origin).protocol !== url.protocol))
    throw new Error('Cross-origin requests are not accepted.');
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new Error('JSON content type required.');
  if (Number(request.headers.get('content-length') ?? 0) > 24000)
    throw new Error('Request too large.');
  const text = await request.text();
  if (text.length > 24000) throw new Error('Request too large.');
  return JSON.parse(text) as unknown;
}
