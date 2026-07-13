/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SITE_URL: string;
  readonly VITE_PUBLIC_API_BASE_URL: string;
  readonly VITE_PUBLIC_BUILD_SHA?: string;
  readonly VITE_PUBLIC_COLLECTION_MODE?: string;
  readonly VITE_PUBLIC_RELEASE_REF?: string;
  readonly VITE_PUBLIC_SURVEY_ID: string;
  readonly VITE_PUBLIC_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
