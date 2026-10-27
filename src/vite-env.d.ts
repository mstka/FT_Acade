/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_OWNER?: string;
  readonly VITE_APP_STAGE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
