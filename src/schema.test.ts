import { describe, expect, it } from 'vitest';
import { responsePayloadSchema } from './schema';

const validPayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'trust-cue-summary',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    visual_notice_review: 'reviewed',
    text_notice_review: 'reviewed',
    trust_rating: 4,
    concerns_influenced_decision: 'Clear tradeoffs would help.'
  },
  metadata: {
    survey_flow_version: 'privacy-notice-comparison-v1',
    started_at: '2026-06-30T00:00:00.000Z',
    completed_at: '2026-06-30T00:02:00.000Z',
    user_agent: 'vitest',
    shown_notice_variant: {
      notice_variant_id: 'trust-cue-summary',
      notice_variant_label: 'Privacy cue summary',
      notice_format: 'visual_trust_cues',
      visual_design_variant_id: 'benefit-badges',
      visual_design_attributes: {
        colorway: 'teal, blue, and amber',
        iconStyle: 'outline privacy badges',
        density: 'balanced',
        sectionEmphasis: 'protections-first',
        layout: 'benefit-card summary grid'
      },
      assignment_method: 'session-randomized-fixed'
    }
  }
};

describe('responsePayloadSchema', () => {
  it('accepts a normalized response payload', () => {
    expect(responsePayloadSchema.parse(validPayload)).toMatchObject({
      survey_id: 'optbot-study-v1',
      variant_id: 'trust-cue-summary',
      metadata: {
        shown_notice_variant: {
          notice_variant_id: 'trust-cue-summary',
          visual_design_variant_id: 'benefit-badges'
        }
      }
    });
  });

  it('rejects unsupported answer value types', () => {
    expect(() =>
      responsePayloadSchema.parse({
        ...validPayload,
        answers: { participation_consent: true }
      })
    ).toThrow();
  });

  it('requires shown notice variant metadata', () => {
    expect(() =>
      responsePayloadSchema.parse({
        ...validPayload,
        metadata: {
          ...validPayload.metadata,
          shown_notice_variant: undefined
        }
      })
    ).toThrow();
  });
});
