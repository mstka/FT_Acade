import { APP_OWNER, APP_STAGE, OWNER_IS_SET, stageTone } from '../config/env';

/** 画面右上の「公開者」と「環境ラベル」。値は環境変数 VITE_APP_OWNER / VITE_APP_STAGE から来る。 */
export default function EnvBadge() {
  return (
    <div className="env" title="環境変数 VITE_APP_OWNER / VITE_APP_STAGE の値">
      <span className={`env__stage env__stage--${stageTone()}`}>{APP_STAGE}</span>
      <span className={`env__owner${OWNER_IS_SET ? '' : ' env__owner--unset'}`}>
        <span className="env__label">公開者</span>
        {APP_OWNER}
      </span>
    </div>
  );
}
