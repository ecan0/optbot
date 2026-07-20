import { describe, expect, it, vi } from 'vitest';
import { createResponseSubmitter } from './api';
import type { ResponsePayload } from './schema';

const validPayload: ResponsePayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'icon-led-disclosure',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    age_range: '25_34',
    ai_usage_frequency: 'weekly',
    visual_notice_review: 'reviewed',
    text_notice_review: 'reviewed',
    presentation_preference: 'prefer_visual_notice',
    visual_willingness: 4,
    visual_trust: 4,
    visual_completeness: 5,
    visual_ease_of_use: 3,
    text_willingness: 3,
    text_trust: 3,
    text_completeness: 4,
    text_ease_of_use: 4,
    notice_descriptions: 'Notice A felt scannable while Notice B felt plain.',
    decision_influence: 'Retention and deletion details influenced my decision.'
  },
  metadata: {
    survey_flow_version: 'paired-notice-attitudes-v1.0.0',
    study_design: 'within-participant-paired',
    primary_outcome: 'willingness_to_share',
    started_at: '2026-06-30T00:00:00.000Z',
    completed_at: '2026-06-30T00:02:00.000Z',
    notice_presentation_order: 'assigned-first',
    assigned_notice_slot: 'A',
    shown_notice_variant: {
      notice_variant_id: 'icon-led-disclosure',
      notice_variant_label: 'Icon-led disclosure',
      notice_format: 'visual_disclosure_ledger',
      visual_design_variant_id: 'disclosure-ledger-v5',
      visual_design_attributes: {
        colorway: 'charcoal, ivory, and periwinkle',
        iconStyle: 'large monoline section symbols',
        density: 'spacious',
        sectionEmphasis: 'four equal disclosure sections',
        layout: 'vertical icon-led disclosure'
      },
      assignment_method: 'fixed-study-treatment'
    }
  },
  turnstile_token: 'verified-token'
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

  it('reports rejected verification without a success result', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 403 }));
    const submit = createResponseSubmitter(
      { apiBaseUrl: 'https://api.example.test', collectionMode: 'live' },
      request
    );

    await expect(submit(validPayload)).rejects.toThrow(
      'Verification was not accepted. Complete it again and retry.'
    );
  });

  it('reports network and malformed success responses as submission failures', async () => {
    const failedRequest = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network unavailable'));
    const malformedRequest = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{}', { status: 201, headers: { 'content-type': 'application/json' } })
    );

    await expect(
      createResponseSubmitter(
        { apiBaseUrl: 'https://api.example.test', collectionMode: 'live' },
        failedRequest
      )(validPayload)
    ).rejects.toThrow('We could not submit your response. Please try again.');
    await expect(
      createResponseSubmitter(
        { apiBaseUrl: 'https://api.example.test', collectionMode: 'live' },
        malformedRequest
      )(validPayload)
    ).rejects.toThrow('We could not confirm that your response was stored. Please try again.');
  });

  it('deduplicates concurrent live submissions', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const request = vi.fn<typeof fetch>().mockReturnValue(pendingResponse);
    const submit = createResponseSubmitter(
      { apiBaseUrl: 'https://api.example.test', collectionMode: 'live' },
      request
    );

    const firstSubmission = submit(validPayload);
    const duplicateSubmission = submit(validPayload);
    expect(duplicateSubmission).toBe(firstSubmission);
    expect(request).toHaveBeenCalledTimes(1);

    resolveRequest?.(
      new Response(JSON.stringify({ response_id: 'response-123' }), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      })
    );
    await expect(firstSubmission).resolves.toMatchObject({ responseId: 'response-123' });
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
