import { Link } from 'react-router-dom';
import type { Member } from '../registry/contributions';

interface Props {
  member: Member;
}

/** Who's Who の一覧に並ぶ、1 人分のカード。押すとその人の専用ページへ */
export default function MemberCard({ member }: Props) {
  const { meta, works } = member;
  const arcade = works.filter((w) => w.meta.category === 'arcade').length;
  const tools = works.filter((w) => w.meta.category === 'tools').length;
  return (
    <Link to={`/members/${meta.slug}`} className="member-card">
      {meta.sample && <span className="member-card__sample">サンプル</span>}
      <span className="member-card__avatar" aria-hidden="true">{meta.emoji}</span>
      <span className="member-card__name">{meta.name}</span>
      <span className="member-card__tagline">{meta.tagline}</span>
      <span className="member-card__works">
        {arcade > 0 && <span className="chip chip--arcade">🕹️ {arcade}</span>}
        {tools > 0 && <span className="chip chip--tools">🧰 {tools}</span>}
        {arcade + tools === 0 && <span className="muted">作品はこれから</span>}
      </span>
    </Link>
  );
}
