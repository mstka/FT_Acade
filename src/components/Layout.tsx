import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const { pathname } = useLocation();

  // ページを移動したら先頭から表示する
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        本文へスキップ
      </a>
      <Header />
      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
