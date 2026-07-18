import { describe, expect, it, vi } from 'vitest';
import { createResponseSubmitter } from './api';
import type { ResponsePayload } from './schema';

const validPayload: ResponsePayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'trust-cue-summary',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    trust_rating: 4
  },
  metadata: {
    survey_flow_version: 'privacy-notice-comparison-v2',
    started_at: '2026-06-30T00:00:00.000Z',
    completed_at: '2026-06-30T00:02:00.000Z',
    shown_notice_variant: {
      notice_variant_id: 'trust-cue-summary',
      notice_variant_label: 'Privacy cue summary',
      notice_format: 'visual_trust_cues',
      visual_design_variant_id: 'privacy-controls-v2',
      visual_design_attributes: {
        colorway: 'charcoal, ivory, and periwinkle',
        iconStyle: 'monoline control symbols',
        density: 'balanced',
        sectionEmphasis: 'protections and participant control',
        layout: 'stacked privacy commitment rows'
      },
      assignment_method: 'session-randomized-fixed'
    }
  }
};

describe('response submission mode', () => {
  it('never contacts a configured API while collection is in preview mode', async () => {
    const request = vi.fn<typeof fetch>();
    const submit = createResponseSubmitter(
      {
        apiBaseUrl: 'https://api.example.test',
        collectionMode: 'preview'
      },
      request
    );

    await expect(submit(validPayload)).resolves.toEqual({ mode: 'preview' });
    expect(request).not.toHaveBeenCalled();
  });

  it('posts a validated response when collection is explicitly live', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ response_id: 'response-123' }), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      })
    );
    const submit = createResponseSubmitter(
      {
        apiBaseUrl: 'https://api.example.test',
        collectionMode: 'live'
      },
      request
    );

    await expect(submit(validPayload)).resolves.toEqual({
      mode: 'submitted',
      responseId: 'response-123'
    });
    expect(request).toHaveBeenCalledWith(
      'https://api.example.test/v1/responses',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('refuses live collection without an API endpoint', async () => {
    const request = vi.fn<typeof fetch>();
    const submit = createResponseSubmitter(
      {
        apiBaseUrl: '',
        collectionMode: 'live'
      },
      request
    );

    await expect(submit(validPayload)).rejects.toThrow('Live collection requires VITE_PUBLIC_API_BASE_URL.');
    expect(request).not.toHaveBeenCalled();
  });
});
