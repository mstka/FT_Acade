import type { ReactNode } from 'react';

interface Props {
  emoji?: string;
  title: string;
  children?: ReactNode;
}

export default function EmptyState({ emoji = '🌱', title, children }: Props) {
  return (
    <div className="empty">
      <span className="empty__emoji" aria-hidden="true">{emoji}</span>
      <p className="empty__title">{title}</p>
      {children && <div className="empty__body">{children}</div>}
    </div>
  );
}
