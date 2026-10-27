import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** どこで落ちたかを伝える見出し */
  label?: string;
}

interface State {
  error: Error | null;
}

/** 子のコンポーネントがエラーを出しても、アプリ全体が真っ白にならないようにする */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FT_Acade]', this.props.label ?? '', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-box" role="alert">
        <p className="error-box__title">⚠️ {this.props.label ?? 'この部分'}でエラーが起きました</p>
        <p>ほかのページは引き続き使えます。開発中なら、ブラウザの開発者ツール (Console) で詳しい内容を確認してください。</p>
        <pre className="error-box__detail">{this.state.error.message}</pre>
        <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
          もう一度表示する
        </button>
      </div>
    );
  }
}
