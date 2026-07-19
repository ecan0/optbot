import { describe, expect, it } from 'vitest';
import { responsePayloadSchema } from './schema';

const validPayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'icon-led-disclosure',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    presentation_preference: 'prefer_assigned_notice',
    visual_notice_review: 'reviewed',
    text_notice_review: 'reviewed',
    trust_rating: 4,
    concerns_influenced_decision: 'Clear retention tradeoffs would help my decision.',
    information_increase_trust: 'A specific deletion timeline would increase trust.'
  },
  metadata: {
    survey_flow_version: 'paired-notice-attitudes-v0.6.5',
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
            concerns_influenced_decision: feedback
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
          information_increase_trust: 'More detail would help'
        }
      })
    ).toThrow('Enter a substantive response of at least five words.');
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
