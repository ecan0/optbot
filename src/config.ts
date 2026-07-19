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
  const releaseRef = env.VITE_PUBLIC_RELEASE_REF || 'local';
  const releaseMatch = /^v(\d+)\.\d+\.\d+$/.exec(releaseRef);
  const releaseMajor = releaseMatch ? Number(releaseMatch[1]) : null;

  if (collectionMode === 'live' && !apiBaseUrl) {
    throw new Error('Live collection requires VITE_PUBLIC_API_BASE_URL.');
  }

  if (collectionMode === 'live' && (releaseMajor === null || releaseMajor < 1)) {
    throw new Error('Live collection is not allowed before v1.0.0.');
  }

  return {
    apiBaseUrl,
    buildSha: env.VITE_PUBLIC_BUILD_SHA || 'local',
    collectionMode,
    releaseRef
  };
}

export const publicRuntimeConfig = createPublicRuntimeConfig(import.meta.env);
