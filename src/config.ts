export type CollectionMode = 'preview' | 'live';

export type PublicRuntimeConfig = {
  apiBaseUrl: string;
  buildSha: string;
  collectionMode: CollectionMode;
  releaseRef: string;
};

export function parseCollectionMode(value: string | undefined): CollectionMode {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === 'preview') {
    return 'preview';
  }

  if (normalized === 'live') {
    return 'live';
  }

  throw new Error(`Invalid VITE_PUBLIC_COLLECTION_MODE: ${value}`);
}

export function createPublicRuntimeConfig(env: ImportMetaEnv): PublicRuntimeConfig {
  const apiBaseUrl = (env.VITE_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const collectionMode = parseCollectionMode(env.VITE_PUBLIC_COLLECTION_MODE);

  if (collectionMode === 'live' && !apiBaseUrl) {
    throw new Error('Live collection requires VITE_PUBLIC_API_BASE_URL.');
  }

  return {
    apiBaseUrl,
    buildSha: env.VITE_PUBLIC_BUILD_SHA || 'local',
    collectionMode,
    releaseRef: env.VITE_PUBLIC_RELEASE_REF || 'local'
  };
}

export const publicRuntimeConfig = createPublicRuntimeConfig(import.meta.env);
