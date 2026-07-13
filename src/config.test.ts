import { describe, expect, it } from 'vitest';
import { createPublicRuntimeConfig, parseCollectionMode } from './config';

const baseEnv: ImportMetaEnv = {
  BASE_URL: '/',
  DEV: false,
  MODE: 'test',
  PROD: false,
  SSR: false,
  VITE_PUBLIC_API_BASE_URL: '',
  VITE_PUBLIC_SITE_URL: 'https://optbot.study',
  VITE_PUBLIC_SURVEY_ID: 'optbot-study-v1',
  VITE_PUBLIC_TURNSTILE_SITE_KEY: ''
};

describe('public runtime configuration', () => {
  it('defaults to preview mode without enabling a configured API', () => {
    expect(
      createPublicRuntimeConfig({
        ...baseEnv,
        VITE_PUBLIC_API_BASE_URL: 'https://api.example.test/'
      })
    ).toEqual({
      apiBaseUrl: 'https://api.example.test',
      buildSha: 'local',
      collectionMode: 'preview',
      releaseRef: 'local'
    });
  });

  it('requires an API endpoint before live collection can start', () => {
    expect(() =>
      createPublicRuntimeConfig({
        ...baseEnv,
        VITE_PUBLIC_COLLECTION_MODE: 'live'
      })
    ).toThrow('Live collection requires VITE_PUBLIC_API_BASE_URL.');
  });

  it('accepts an explicit live configuration with deployment identity', () => {
    expect(
      createPublicRuntimeConfig({
        ...baseEnv,
        VITE_PUBLIC_API_BASE_URL: 'https://api.example.test',
        VITE_PUBLIC_BUILD_SHA: 'abc123',
        VITE_PUBLIC_COLLECTION_MODE: 'live',
        VITE_PUBLIC_RELEASE_REF: 'v1.0.0'
      })
    ).toMatchObject({
      buildSha: 'abc123',
      collectionMode: 'live',
      releaseRef: 'v1.0.0'
    });
  });

  it('rejects unknown collection modes instead of guessing', () => {
    expect(() => parseCollectionMode('staging')).toThrow('Invalid VITE_PUBLIC_COLLECTION_MODE: staging');
  });
});
