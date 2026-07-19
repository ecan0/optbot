import { describe, expect, it } from 'vitest';
import { responsePayloadSchema } from './schema';

const validPayload = {
  survey_id: 'optbot-study-v1',
  variant_id: 'icon-led-disclosure',
  consent_version: 'ai-training-consent-v1',
  answers: {
    participation_consent: 'consent_yes',
    age_range: '25_34',
    ai_usage_frequency: 'weekly',
    presentation_preference: 'prefer_visual_notice',
    visual_notice_review: 'reviewed',
    text_notice_review: 'reviewed',
    visual_willingness: 4,
    visual_trust: 4,
    visual_completeness: 5,
    visual_ease_of_use: 3,
    text_willingness: 3,
    text_trust: 3,
    text_completeness: 4,
    text_ease_of_use: 4,
    notice_descriptions: 'Notice A felt visual while Notice B felt dense.',
    decision_influence: 'Clear retention tradeoffs most influenced my decision.'
  },
  metadata: {
    survey_flow_version: 'paired-notice-attitudes-v0.7.5',
    study_design: 'within-participant-paired',
    primary_outcome: 'willingness_to_share',
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

  it.each(['participation_consent', 'age_range', 'ai_usage_frequency', 'visual_notice_review', 'text_notice_review'])(
    'requires structured answer: %s',
    (answerId) => {
      const answers = { ...validPayload.answers };
      delete answers[answerId as keyof typeof answers];

      expect(() => responsePayloadSchema.parse({ ...validPayload, answers })).toThrow(
        'Complete every required study question.'
      );
    }
  );

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
