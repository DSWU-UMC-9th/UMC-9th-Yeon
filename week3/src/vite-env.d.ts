/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEYL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
