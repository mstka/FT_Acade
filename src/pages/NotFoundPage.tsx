import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('ページが見つかりません');
  return (
    <div className="page not-found">
      <p className="not-found__code" aria-hidden="true">404</p>
      <h1 className="not-found__title">ページが見つかりません</h1>
      <p>URL が間違っているか、ページがまだ追加されていないようです。</p>
      <Link to="/" className="btn btn--primary">ホームへ戻る</Link>
    </div>
  );
}
