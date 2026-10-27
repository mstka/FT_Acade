import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import MemberPage from './pages/MemberPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import GitVisualizerPage from './pages/GitVisualizerPage';

// HashRouter を使うので URL は /#/arcade のようになる。Vercel でリライト設定をしなくても動く。
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="arcade" element={<CategoryPage category="arcade" />} />
          <Route path="who-is-who" element={<CategoryPage category="who-is-who" />} />
          <Route path="tools" element={<CategoryPage category="tools" />} />
          <Route path="members/:slug" element={<MemberPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="git" element={<GitVisualizerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
