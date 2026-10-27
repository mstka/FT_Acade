// [L3 発展] Vercel Function: GET / POST /api/scores
// ブラウザは GAS に直接アクセスせず、この関数を経由する (GAS の URL と合言葉をブラウザに渡さないため)。
// 環境変数 (Vercel のサーバー側だけに設定する):
//   GAS_WEB_APP_URL   GAS をウェブアプリとしてデプロイした URL
//   GAS_SHARED_TOKEN  GAS 側のスクリプトプロパティ SHARED_TOKEN と同じ値
// どちらも未設定ならダミーデータで答える。

interface Score {
  name: string;
  game: string;
  score: number;
}

const MOCK_SCORES: Score[] = [
  { name: 'ピクセル太郎', game: '反射神経ゲーム', score: 231 },
  { name: 'ドット花子', game: '反射神経ゲーム', score: 268 },
  { name: 'ビット次郎', game: '反射神経ゲーム', score: 302 },
];

function gasConfig() {
  const url = process.env.GAS_WEB_APP_URL;
  const token = process.env.GAS_SHARED_TOKEN ?? '';
  return url ? { url, token } : null;
}

function validate(body: unknown): Score | string {
  if (!body || typeof body !== 'object') return 'JSON の形式が正しくありません';
  const { name, game, score } = body as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.length > 20) return 'name は 1〜20 文字で入力してください';
  if (typeof game !== 'string' || !game.trim() || game.length > 30) return 'game は 1〜30 文字で入力してください';
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1_000_000) return 'score は 0〜1000000 の数値にしてください';
  return { name: name.trim(), game: game.trim(), score: Math.round(score) };
}

export async function GET(): Promise<Response> {
  const gas = gasConfig();
  if (!gas) return Response.json({ scores: MOCK_SCORES, mode: 'mock' });
  try {
    const res = await fetch(`${gas.url}?action=scores&token=${encodeURIComponent(gas.token)}`);
    const data = (await res.json()) as { scores?: Score[]; error?: string };
    if (!res.ok || !Array.isArray(data.scores)) return Response.json({ error: data.error ?? 'GAS からの応答が不正です' }, { status: 502 });
    return Response.json({ scores: data.scores, mode: 'gas' });
  } catch {
    return Response.json({ error: 'GAS に接続できませんでした' }, { status: 502 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const parsed = validate(await request.json().catch(() => null));
  if (typeof parsed === 'string') return Response.json({ ok: false, message: parsed }, { status: 400 });

  const gas = gasConfig();
  if (!gas) return Response.json({ ok: true, message: 'モックモードのため保存はされません' });
  try {
    const res = await fetch(gas.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // GAS の doPost は text/plain で受けると扱いやすい
      body: JSON.stringify({ action: 'addScore', token: gas.token, score: parsed }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) return Response.json({ ok: false, message: data.error ?? '保存に失敗しました' }, { status: 502 });
    return Response.json({ ok: true, message: '保存しました' });
  } catch {
    return Response.json({ ok: false, message: 'GAS に接続できませんでした' }, { status: 502 });
  }
}
