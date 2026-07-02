import { describe, expect, it } from 'vitest';
import { consentVersion, noticeVariants, studySteps } from './studyContent';
import {
  buildResponsePayload,
  getStepValidationMessage,
  isConsentDenied,
  isStepComplete,
  reviewAcknowledgedValue
} from './surveyLogic';
import type { SurveyAnswers } from './types';

describe('survey logic', () => {
  it('recognizes the consent denial path without submitting', () => {
    const answers: SurveyAnswers = {
      participation_consent: 'consent_no'
    };

    expect(isConsentDenied(answers)).toBe(true);
  });

  it('validates required grouped answers', () => {
    const contextStep = studySteps.find((step) => step.id === 'participant_context');
    const likertStep = studySteps.find((step) => step.id === 'notice_evaluation');

    expect(contextStep?.kind).toBe('context');
    expect(likertStep?.kind).toBe('likert-group');

    if (contextStep?.kind !== 'context' || likertStep?.kind !== 'likert-group') {
      throw new Error('Expected grouped study steps');
    }

    expect(isStepComplete(contextStep, { age_range: '18_24' })).toBe(false);
    expect(getStepValidationMessage(contextStep, { age_range: '18_24' })).toContain('context');

    const completeContext = Object.fromEntries(
      contextStep.questions.map((question) => [question.id, question.choices?.[0].id ?? ''])
    );

    expect(isStepComplete(contextStep, completeContext)).toBe(true);
    expect(isStepComplete(likertStep, { clarity_rating: 3 })).toBe(false);
  });

  it('requires notice review acknowledgements', () => {
    const reviewStep = studySteps.find((step) => step.id === 'visual_notice_review');
    expect(reviewStep?.kind).toBe('notice-review');

    if (reviewStep?.kind !== 'notice-review') {
      throw new Error('Expected notice review step');
    }

    expect(isStepComplete(reviewStep, {})).toBe(false);
    expect(isStepComplete(reviewStep, { visual_notice_review: reviewAcknowledgedValue })).toBe(true);
  });

  it('builds a payload that records the shown notice and design variant', () => {
    const variant = noticeVariants.find((noticeVariant) => noticeVariant.id === 'transparency-flow');
    expect(variant).toBeTruthy();

    if (!variant) {
      throw new Error('Expected transparency variant');
    }

    const payload = buildResponsePayload({
      surveyId: 'optbot-study-v1',
      consentVersion,
      answers: {
        participation_consent: 'consent_yes',
        visual_notice_review: reviewAcknowledgedValue,
        text_notice_review: reviewAcknowledgedValue,
        presentation_preference: 'prefer_both_together',
        clarity_rating: 4,
        trust_rating: 4,
        confidence_rating: 4,
        completeness_rating: 5,
        ease_of_use_rating: 4,
        comfort_sharing: 3,
        willingness_to_share: 3
      },
      variant,
      startedAt: '2026-06-30T00:00:00.000Z',
      completedAt: '2026-06-30T00:02:00.000Z',
      userAgent: 'vitest'
    });

    expect(payload.variant_id).toBe('transparency-flow');
    expect(payload.metadata.shown_notice_variant).toMatchObject({
      notice_variant_id: 'transparency-flow',
      notice_format: 'visual_transparency_flow',
      visual_design_variant_id: 'data-flow-timeline',
      assignment_method: 'session-randomized-fixed'
    });
  });
});
