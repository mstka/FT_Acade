// [L3 発展] Vercel Function: GET /api/health
// GAS_WEB_APP_URL が設定されていれば "gas"、なければ "mock" と答える。
export function GET(): Response {
  const mode = process.env.GAS_WEB_APP_URL ? 'gas' : 'mock';
  return Response.json({ ok: true, mode });
}
