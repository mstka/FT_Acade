// [L3 発展] バックエンド API の呼び出しをまとめたファイル。
// VITE_API_BASE_URL が空ならモック (ダミーデータ) で動くので、GAS が無くても画面は壊れない。

export interface Score {
  name: string;
  game: string;
  score: number;
}

export interface Health {
  ok: boolean;
  mode: 'mock' | 'api';
  message: string;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
export const IS_MOCK = BASE_URL === '';
const TIMEOUT_MS = 8000;

// 架空のデータ。実在の人物は使わない。
const MOCK_SCORES: Score[] = [
  { name: 'ピクセル太郎', game: '反射神経ゲーム', score: 231 },
  { name: 'ドット花子', game: '反射神経ゲーム', score: 268 },
  { name: 'ビット次郎', game: '反射神経ゲーム', score: 302 },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`サーバーがエラーを返しました (HTTP ${res.status})`);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('時間内に応答がありませんでした', { cause: e });
    if (e instanceof TypeError) throw new Error('サーバーに接続できませんでした', { cause: e });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealth(): Promise<Health> {
  if (IS_MOCK) {
    await wait(300);
    return { ok: true, mode: 'mock', message: 'モックモードで動作中 (VITE_API_BASE_URL 未設定)' };
  }
  const data = await request<{ ok: boolean; mode?: string }>('/health');
  return { ok: data.ok, mode: 'api', message: data.ok ? `API に接続できました (${data.mode ?? 'api'})` : 'API が異常を返しました' };
}

export async function getScores(): Promise<Score[]> {
  if (IS_MOCK) {
    await wait(300);
    return MOCK_SCORES;
  }
  const data = await request<{ scores: Score[] }>('/scores');
  return data.scores;
}

export async function postScore(score: Score): Promise<{ ok: boolean; message: string }> {
  if (IS_MOCK) {
    await wait(300);
    return { ok: true, message: 'モックモードのため保存はされません' };
  }
  return request<{ ok: boolean; message: string }>('/scores', { method: 'POST', body: JSON.stringify(score) });
}
