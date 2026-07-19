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
    const likertStep = studySteps.find((step) => step.id === 'notice_evaluation_clarity');

    expect(contextStep?.kind).toBe('context');
    expect(likertStep?.kind).toBe('likert-group');

    if (contextStep?.kind !== 'context' || likertStep?.kind !== 'likert-group') {
      throw new Error('Expected grouped study steps');
    }

    expect(getStepCompletion(contextStep, { age_range: '18_24' })).toEqual({ completed: 1, total: 4 });
    expect(isStepComplete(contextStep, { age_range: '18_24' })).toBe(false);
    expect(getStepValidationMessage(contextStep, { age_range: '18_24' })).toContain('context');

    const completeContext = Object.fromEntries(
      contextStep.questions.map((question) => [question.id, question.choices?.[0].id ?? ''])
    );

    expect(isStepComplete(contextStep, completeContext)).toBe(true);
    expect(getStepCompletion(likertStep, { clarity_rating: 3 })).toEqual({ completed: 1, total: 3 });
    expect(isStepComplete(likertStep, { clarity_rating: 3 })).toBe(false);
  });

  it('requires substantive five-word responses for both final prompts', () => {
    const feedbackStep = studySteps.find((step) => step.id === 'open_response');
    expect(feedbackStep?.kind).toBe('text-group');

    if (feedbackStep?.kind !== 'text-group') {
      throw new Error('Expected final feedback step');
    }

    expect(
      getStepCompletion(feedbackStep, {
        concerns_influenced_decision: 'Retention limits affected my final decision.',
        information_increase_trust: 'none none none none none'
      })
    ).toEqual({ completed: 1, total: 2 });
    expect(
      isStepComplete(feedbackStep, {
        concerns_influenced_decision: 'Retention limits affected my final decision.',
        information_increase_trust: 'none none none none none'
      })
    ).toBe(false);
    expect(
      isStepComplete(feedbackStep, {
        concerns_influenced_decision: 'Retention limits affected my final decision.',
        information_increase_trust: 'A deletion deadline would increase my trust.'
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
        presentation_preference: 'prefer_assigned_notice',
        clarity_rating: 4,
        trust_rating: 4,
        confidence_rating: 4,
        completeness_rating: 5,
        ease_of_use_rating: 4,
        concerns_influenced_decision: 'Retention and deletion controls influenced my decision.',
        information_increase_trust: 'A specific deletion deadline would increase trust.'
      },
      variant: visualNoticeVariant,
      noticeOrder: 'reference-first',
      startedAt: '2026-06-30T00:00:00.000Z',
      completedAt: '2026-06-30T00:02:00.000Z',
      userAgent: 'vitest'
    });

    expect(payload.variant_id).toBe('icon-led-disclosure');
    expect(payload.metadata).toMatchObject({
      survey_flow_version: 'paired-notice-attitudes-v0.6.5',
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
