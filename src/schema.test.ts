import { describe, expect, it } from 'vitest';
import { responsePayloadSchema } from './schema';

const validPayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'guided-a',
  consent_version: 'consent-placeholder-v1',
  answers: {
    intro_consent: 'consent_yes',
    confidence: 4,
    explanation_style: 'Clear tradeoffs would help.'
  },
  metadata: {
    started_at: '2026-06-30T00:00:00.000Z',
    completed_at: '2026-06-30T00:02:00.000Z',
    user_agent: 'vitest'
  }
};

describe('responsePayloadSchema', () => {
  it('accepts a normalized response payload', () => {
    expect(responsePayloadSchema.parse(validPayload)).toMatchObject({
      survey_id: 'optbot-study-v1',
      variant_id: 'guided-a'
    });
  });

  it('rejects unsupported answer value types', () => {
    expect(() =>
      responsePayloadSchema.parse({
        ...validPayload,
        answers: { intro_consent: true }
      })
    ).toThrow();
  });
});
