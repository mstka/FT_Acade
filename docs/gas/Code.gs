/**
 * [L3 発展] FT_Acade 用 GAS バックエンドのサンプル
 *
 * 準備:
 *   1. Google スプレッドシートを作り、「拡張機能 > Apps Script」でこのコードを貼る
 *   2. シート名を "scores" にして、1 行目に name / game / score / createdAt と見出しを入れる
 *   3. 「プロジェクトの設定 > スクリプト プロパティ」に SHARED_TOKEN を追加 (推測されにくい長い文字列)
 *   4. 「デプロイ > 新しいデプロイ > ウェブアプリ」で公開し、URL を Vercel の GAS_WEB_APP_URL に、
 *      同じ合言葉を GAS_SHARED_TOKEN に設定する (どちらもブラウザには渡さない)
 *
 * 注意: 合言葉は「URL を知っているだけでは使えない」ための最低限の仕組みです。
 * 継続して社内で使う前に、認証・利用制限・データの扱いを別途設計してください。
 * ダミーデータ以外 (個人情報など) は保存しないでください。
 */

const SHEET_NAME = 'scores';
const MAX_ROWS_RETURNED = 50;

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function authorized_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('SHARED_TOKEN');
  return Boolean(expected) && token === expected;
}

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function doGet(e) {
  if (!authorized_(e.parameter.token)) return json_({ error: 'unauthorized' });
  if (e.parameter.action !== 'scores') return json_({ error: 'unknown action' });

  const rows = sheet_().getDataRange().getValues().slice(1);
  const scores = rows
    .map((r) => ({ name: String(r[0]), game: String(r[1]), score: Number(r[2]) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_ROWS_RETURNED);
  return json_({ scores: scores });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'invalid json' });
  }
  if (!authorized_(body.token)) return json_({ ok: false, error: 'unauthorized' });
  if (body.action !== 'addScore') return json_({ ok: false, error: 'unknown action' });

  const s = body.score || {};
  const valid = typeof s.name === 'string' && s.name.length <= 20 && typeof s.game === 'string' && s.game.length <= 30 && typeof s.score === 'number';
  if (!valid) return json_({ ok: false, error: 'invalid score' });

  sheet_().appendRow([s.name, s.game, s.score, new Date()]);
  return json_({ ok: true });
}
