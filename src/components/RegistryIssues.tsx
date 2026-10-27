import { registryIssues } from '../registry/contributions';

/** 読み込めなかった src/contributions/ のファイルと、その直し方を表示する */
export default function RegistryIssues() {
  if (!registryIssues.length) return null;
  return (
    <section className="issues" role="status" aria-labelledby="issues-title">
      <h2 id="issues-title" className="issues__title">⚠️ 表示できなかったページがあります</h2>
      <ul className="issues__list">
        {registryIssues.map((issue) => (
          <li key={issue.file}>
            <code>{issue.file}</code>
            <ul>
              {issue.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
