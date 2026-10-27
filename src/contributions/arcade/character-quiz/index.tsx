import { useState } from 'react';
import type { WorkMeta } from '../../../types/contribution';
import styles from './style.module.css';

export const meta: WorkMeta = {
  slug: 'character-quiz',
  title: '架空の人物当てクイズ',
  description: 'ヒントを読んで、どのキャラクターのことか当てよう。登場人物はすべて架空です。',
  emoji: '🕵️',
  addedAt: '2026-10-27',
  sample: true,
};

interface Question {
  hints: string[];
  choices: string[];
  answer: string;
  comment: string;
}

// 登場人物はすべて架空。実在のメンバーの情報は使わないこと。
const QUESTIONS: Question[] = [
  {
    hints: ['趣味は日なたぼっこ', '好きな食べ物はかつおぶし', '口ぐせは「にゃるほど」'],
    choices: ['ねこ田 ミケ子', 'そら野 ハヤト', 'もり川 コケ美', 'ほし宮 ルナ'],
    answer: 'ねこ田 ミケ子',
    comment: 'ミケ子さんは会議中もよく丸くなっています。',
  },
  {
    hints: ['週末は紙飛行機の大会に出ている', '通勤は自転車で 15 分', '口ぐせは「とりあえず飛ばしてみよう」'],
    choices: ['ほし宮 ルナ', 'そら野 ハヤト', 'ねこ田 ミケ子', 'うみ辺 シオン'],
    answer: 'そら野 ハヤト',
    comment: 'ハヤトさんの紙飛行機の最高記録は 42 メートルだそうです。',
  },
  {
    hints: ['机の上に小さなコケの鉢がある', '好きな言葉は「ゆっくり育てる」', 'お昼はいつも手作りのおにぎり'],
    choices: ['うみ辺 シオン', 'ねこ田 ミケ子', 'もり川 コケ美', 'そら野 ハヤト'],
    answer: 'もり川 コケ美',
    comment: 'コケ美さんのコケは、もう 3 年目に入りました。',
  },
  {
    hints: ['夜型で、星を見るのが好き', '天体望遠鏡を 2 台持っている', '口ぐせは「月がきれいですね」'],
    choices: ['もり川 コケ美', 'ほし宮 ルナ', 'うみ辺 シオン', 'ねこ田 ミケ子'],
    answer: 'ほし宮 ルナ',
    comment: 'ルナさんはオフィスの屋上で観望会を開いたことがあります。',
  },
];

export default function CharacterQuiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const finished = index >= QUESTIONS.length;

  const choose = (choice: string) => {
    if (picked) return;
    setPicked(choice);
    if (choice === QUESTIONS[index].answer) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (finished) {
    const perfect = score === QUESTIONS.length;
    return (
      <div className={styles.result}>
        <p className={styles.resultEmoji} aria-hidden="true">{perfect ? '🎉' : '📝'}</p>
        <p className={styles.resultScore}>{QUESTIONS.length} 問中 {score} 問 正解！</p>
        <p className="muted">{perfect ? 'パーフェクト！全員のことを覚えていましたね。' : 'もう一度チャレンジしてみよう。'}</p>
        <button type="button" className="btn btn--primary" onClick={restart}>もう一度遊ぶ</button>
      </div>
    );
  }

  const q = QUESTIONS[index];
  const correct = picked === q.answer;

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        <span>第 {index + 1} 問 / {QUESTIONS.length}</span>
        <span>スコア {score}</span>
      </div>

      <div className={styles.card}>
        <p className={styles.ask}>この人はだれ？</p>
        <ul className={styles.hints}>
          {q.hints.map((h) => (
            <li key={h}>💡 {h}</li>
          ))}
        </ul>
      </div>

      <div className={styles.choices}>
        {q.choices.map((c) => {
          const state = !picked ? '' : c === q.answer ? styles.right : c === picked ? styles.wrong : styles.faded;
          return (
            <button key={c} type="button" className={`${styles.choice} ${state}`} onClick={() => choose(c)} disabled={Boolean(picked)}>
              {c}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className={`${styles.feedback} ${correct ? styles.ok : styles.ng}`} role="status">
          <p className={styles.feedbackTitle}>{correct ? '⭕ 正解！' : `❌ 残念… 正解は「${q.answer}」`}</p>
          <p>{q.comment}</p>
          <button type="button" className="btn btn--primary" onClick={next}>
            {index + 1 < QUESTIONS.length ? '次の問題へ' : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  );
}
