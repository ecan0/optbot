import { describe, expect, it } from 'vitest';
import { responsePayloadSchema } from './schema';

const validPayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'icon-led-disclosure',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    presentation_preference: 'prefer_visual_notice',
    visual_notice_review: 'reviewed',
    text_notice_review: 'reviewed',
    visual_willingness: 4,
    visual_trust: 4,
    visual_understanding: 5,
    visual_privacy_concern: 3,
    text_willingness: 3,
    text_trust: 3,
    text_understanding: 4,
    text_privacy_concern: 4,
    decision_influence: 'Clear retention tradeoffs most influenced my decision.'
  },
  metadata: {
    survey_flow_version: 'paired-notice-attitudes-v0.7.0',
    started_at: '2026-06-30T00:00:00.000Z',
    completed_at: '2026-06-30T00:02:00.000Z',
    user_agent: 'vitest',
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
  }
};

describe('responsePayloadSchema', () => {
  it('accepts a normalized response payload', () => {
    expect(responsePayloadSchema.parse(validPayload)).toMatchObject({
      survey_id: 'optbot-study-v1',
      variant_id: 'icon-led-disclosure',
      metadata: {
        shown_notice_variant: {
          notice_variant_id: 'icon-led-disclosure',
          visual_design_variant_id: 'disclosure-ledger-v5'
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

  it.each(['prefer_both_together', 'prefer_not_sure'])(
    'rejects removed preference value: %s',
    (presentationPreference) => {
      expect(() =>
        responsePayloadSchema.parse({
          ...validPayload,
          answers: {
            ...validPayload.answers,
            presentation_preference: presentationPreference
          }
        })
      ).toThrow('Choose Notice A or Notice B.');
    }
  );

  it.each(['N/A', 'none', 'none none none none none', 'I do not have any concerns'])(
    'rejects blank-equivalent feedback: %s',
    (feedback) => {
      expect(() =>
        responsePayloadSchema.parse({
          ...validPayload,
          answers: {
            ...validPayload.answers,
            decision_influence: feedback
          }
        })
      ).toThrow('Enter a substantive response of at least five words.');
    }
  );

  it('rejects a final response shorter than five words', () => {
    expect(() =>
      responsePayloadSchema.parse({
        ...validPayload,
        answers: {
          ...validPayload.answers,
          decision_influence: 'More detail would help'
        }
      })
    ).toThrow('Enter a substantive response of at least five words.');
  });

  it.each([0, 6, 3.5, '4'])('rejects an invalid paired rating: %s', (rating) => {
    expect(() =>
      responsePayloadSchema.parse({
        ...validPayload,
        answers: {
          ...validPayload.answers,
          visual_willingness: rating
        }
      })
    ).toThrow('Choose a rating from 1 to 5.');
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
