import { useMemo, useState } from 'react';
import type { ContributionMeta } from '../../types/contribution';
import styles from './style.module.css';

export const meta: ContributionMeta = {
  slug: 'demo-tool',
  name: 'FT_Acade サンプル',
  category: 'tools',
  title: '文章整形・文字数カウンター',
  description: '文字数や行数を数えて、余分な空白や空行を整えます。整えた文章はワンクリックでコピー。',
  emoji: '📝',
  addedAt: '2026-10-27',
};

interface Options {
  trimLines: boolean;
  collapseSpaces: boolean;
  collapseBlankLines: boolean;
  fullWidthSpace: boolean;
}

const OPTION_LABELS: Record<keyof Options, string> = {
  trimLines: '行頭・行末の空白を消す',
  collapseSpaces: '連続した空白を 1 つにする',
  collapseBlankLines: '連続した空行を 1 行にする',
  fullWidthSpace: '全角スペースを半角にする',
};

const SAMPLE = '  FT_Acade   へようこそ！  \n\n\n\nこれは　文章整形ツールの   サンプルです。\n   空白や空行を   整えてみましょう。  ';

const FULL_WIDTH_SPACE = String.fromCharCode(0x3000);

// 絵文字や結合文字も「1 文字」として数える
function countChars(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)].length;
  }
  return Array.from(text).length;
}

function format(text: string, o: Options): string {
  let t = text.replace(/\r\n?/g, '\n');
  if (o.fullWidthSpace) t = t.replaceAll(FULL_WIDTH_SPACE, ' ');
  if (o.collapseSpaces) t = t.replace(/[ \t]{2,}/g, ' ');
  if (o.trimLines) t = t.split('\n').map((l) => l.trim()).join('\n');
  if (o.collapseBlankLines) t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

function stats(text: string) {
  return {
    chars: countChars(text),
    noSpace: countChars(text.replace(/\s/g, '')),
    lines: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
  };
}

export default function DemoTool() {
  const [text, setText] = useState(SAMPLE);
  const [options, setOptions] = useState<Options>({ trimLines: true, collapseSpaces: true, collapseBlankLines: true, fullWidthSpace: false });
  const [copied, setCopied] = useState<'idle' | 'ok' | 'ng'>('idle');

  const output = useMemo(() => format(text, options), [text, options]);
  const before = stats(text);
  const after = stats(output);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied('ok');
    } catch {
      setCopied('ng');
    }
    window.setTimeout(() => setCopied('idle'), 2000);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.columns}>
        <label className={styles.field}>
          <span className={styles.label}>元の文章</span>
          <textarea className={styles.area} value={text} onChange={(e) => setText(e.target.value)} rows={9} />
          <Stats {...before} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>整えた文章</span>
          <textarea className={`${styles.area} ${styles.output}`} value={output} readOnly rows={9} />
          <Stats {...after} />
        </label>
      </div>

      <fieldset className={styles.options}>
        <legend>整え方</legend>
        {(Object.keys(OPTION_LABELS) as (keyof Options)[]).map((key) => (
          <label key={key} className={styles.option}>
            <input type="checkbox" checked={options[key]} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} />
            {OPTION_LABELS[key]}
          </label>
        ))}
      </fieldset>

      <div className={styles.actions}>
        <button type="button" className="btn btn--primary" onClick={copy} disabled={!output}>📋 整えた文章をコピー</button>
        <button type="button" className="btn" onClick={() => setText('')}>クリア</button>
        <span role="status" className={styles.copied}>
          {copied === 'ok' && '✅ コピーしました'}
          {copied === 'ng' && '⚠️ コピーできませんでした。右の欄を選択して Ctrl+C (Mac は ⌘+C) でコピーしてください'}
        </span>
      </div>
    </div>
  );
}

function Stats({ chars, noSpace, lines }: { chars: number; noSpace: number; lines: number }) {
  return (
    <span className={styles.stats}>
      <span><strong>{chars}</strong> 文字</span>
      <span>空白なし <strong>{noSpace}</strong> 文字</span>
      <span><strong>{lines}</strong> 行</span>
    </span>
  );
}
