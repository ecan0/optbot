import { describe, expect, it } from 'vitest';
import { buildStudySteps, consentVersion, visualNoticeVariant } from './studyContent';
import {
  assignNoticePresentationOrder,
  buildResponsePayload,
  getNoticeSlot,
  getStepCompletion,
  getStepValidationMessage,
  isConsentDenied,
  isStepComplete,
  reviewAcknowledgedValue
} from './surveyLogic';
import type { SurveyAnswers } from './types';

const studySteps = buildStudySteps('assigned-first');

describe('survey logic', () => {
  it('recognizes the consent denial path without submitting', () => {
    const answers: SurveyAnswers = {
      participation_consent: 'consent_no'
    };

    expect(isConsentDenied(answers)).toBe(true);
  });

  it('persists a counterbalanced notice order for the session', () => {
    const stored = new Map<string, string>();
    const store = {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value)
    };
    const referenceFirstCrypto = {
      getRandomValues<T extends ArrayBufferView | null>(array: T): T {
        if (array instanceof Uint32Array) {
          array[0] = 1;
        }
        return array;
      }
    };
    const assignedFirstCrypto = {
      getRandomValues<T extends ArrayBufferView | null>(array: T): T {
        if (array instanceof Uint32Array) {
          array[0] = 0;
        }
        return array;
      }
    };

    expect(assignNoticePresentationOrder(store, referenceFirstCrypto)).toBe('reference-first');
    expect(assignNoticePresentationOrder(store, assignedFirstCrypto)).toBe('reference-first');
    expect(getNoticeSlot('reference-text')).toBe('B');
    expect(getNoticeSlot('assigned')).toBe('A');
  });

  it('reports and validates required grouped-answer progress', () => {
    const contextStep = studySteps.find((step) => step.id === 'participant_context');
    const likertStep = studySteps.find((step) => step.id === 'visual_notice_attitudes');

    expect(contextStep?.kind).toBe('context');
    expect(likertStep?.kind).toBe('likert-group');

    if (contextStep?.kind !== 'context' || likertStep?.kind !== 'likert-group') {
      throw new Error('Expected grouped study steps');
    }

    expect(getStepCompletion(contextStep, { age_range: '18_24' })).toEqual({ completed: 1, total: 2 });
    expect(isStepComplete(contextStep, { age_range: '18_24' })).toBe(false);
    expect(getStepValidationMessage(contextStep, { age_range: '18_24' })).toContain('context');

    const completeContext = Object.fromEntries(
      contextStep.questions.map((question) => [question.id, question.choices?.[0].id ?? ''])
    );

    expect(isStepComplete(contextStep, completeContext)).toBe(true);
    expect(getStepCompletion(likertStep, { visual_willingness: 3 })).toEqual({ completed: 1, total: 4 });
    expect(isStepComplete(likertStep, { visual_willingness: 3 })).toBe(false);
  });

  it('requires two substantive five-word interview responses', () => {
    const feedbackStep = studySteps.find((step) => step.id === 'open_response');
    expect(feedbackStep?.kind).toBe('text-group');

    if (feedbackStep?.kind !== 'text-group') {
      throw new Error('Expected final feedback step');
    }

    expect(
      getStepCompletion(feedbackStep, {
        notice_descriptions: 'Visual and clear versus plain text.',
        decision_influence: 'none none none none none'
      })
    ).toEqual({ completed: 1, total: 2 });
    expect(
      isStepComplete(feedbackStep, {
        notice_descriptions: 'Visual and clear versus plain text.',
        decision_influence: 'none none none none none'
      })
    ).toBe(false);
    expect(
      isStepComplete(feedbackStep, {
        notice_descriptions: 'Notice A felt visual; Notice B felt plain.',
        decision_influence: 'Retention limits affected my final decision.'
      })
    ).toBe(true);
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

  it('records the fixed visual treatment, presentation order, and assigned slot', () => {

    const payload = buildResponsePayload({
      surveyId: 'optbot-study-v1',
      consentVersion,
      answers: {
        participation_consent: 'consent_yes',
        visual_notice_review: reviewAcknowledgedValue,
        text_notice_review: reviewAcknowledgedValue,
        presentation_preference: 'prefer_visual_notice',
        visual_willingness: 4,
        visual_trust: 4,
        visual_completeness: 4,
        visual_ease_of_use: 3,
        text_willingness: 3,
        text_trust: 3,
        text_completeness: 4,
        text_ease_of_use: 4,
        notice_descriptions: 'Notice A felt scannable while Notice B felt dense.',
        decision_influence: 'Retention and deletion controls influenced my decision.'
      },
      variant: visualNoticeVariant,
      noticeOrder: 'reference-first',
      startedAt: '2026-06-30T00:00:00.000Z',
      completedAt: '2026-06-30T00:02:00.000Z',
      userAgent: 'vitest'
    });

    expect(payload.variant_id).toBe('icon-led-disclosure');
    expect(payload.metadata).toMatchObject({
      survey_flow_version: 'paired-notice-attitudes-v0.8.0',
      study_design: 'within-participant-paired',
      primary_outcome: 'willingness_to_share',
      notice_presentation_order: 'reference-first',
      assigned_notice_slot: 'A',
      shown_notice_variant: {
        notice_variant_id: 'icon-led-disclosure',
        notice_format: 'visual_disclosure_ledger',
        visual_design_variant_id: 'disclosure-ledger-v5',
        assignment_method: 'fixed-study-treatment'
      }
    });
  });
});
