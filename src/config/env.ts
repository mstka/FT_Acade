// VITE_ で始まる値はビルド時に埋め込まれ、ブラウザから誰でも見られる。秘密の値は入れないこと。
const owner = import.meta.env.VITE_APP_OWNER?.trim();
const stage = import.meta.env.VITE_APP_STAGE?.trim();

export const APP_OWNER = owner || 'Guest';
export const APP_STAGE = stage || (import.meta.env.DEV ? 'local' : '未設定');
export const OWNER_IS_SET = Boolean(owner);
export const STAGE_IS_SET = Boolean(stage);

export type StageTone = 'production' | 'preview' | 'local' | 'other';

export function stageTone(value: string = APP_STAGE): StageTone {
  const v = value.toLowerCase();
  if (v === 'production' || v === 'prod') return 'production';
  if (v === 'preview' || v === 'staging') return 'preview';
  if (v === 'local' || v === 'development' || v === 'dev') return 'local';
  return 'other';
}
