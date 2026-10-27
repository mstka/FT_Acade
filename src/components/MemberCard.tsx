import { Link } from 'react-router-dom';
import type { Member } from '../registry/contributions';

interface Props {
  member: Member;
}

/** Who's Who の一覧に並ぶ、1 人分のカード。押すとその人の専用ページへ */
export default function MemberCard({ member }: Props) {
  const { meta } = member;
  return (
    <Link to={`/members/${meta.slug}`} className="member-card">
      {meta.sample && <span className="member-card__sample">サンプル</span>}
      <span className="member-card__avatar" aria-hidden="true">{meta.emoji}</span>
      <span className="member-card__name">{meta.name}</span>
      <span className="member-card__tagline">{meta.tagline}</span>
    </Link>
  );
}
