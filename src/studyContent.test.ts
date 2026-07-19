import { describe, expect, it } from 'vitest';
import {
  buildStudySteps,
  noticeHeadline,
  noticeSummary,
  referenceNoticeSections,
  visualNoticeVariant
} from './studyContent';

const assignedFirstSteps = buildStudySteps('assigned-first');
const referenceFirstSteps = buildStudySteps('reference-first');

describe('study content', () => {
  it.each([
    ['assigned-first', assignedFirstSteps],
    ['reference-first', referenceFirstSteps]
  ])('uses stable unique step ids for %s order', (_order, steps) => {
    const ids = steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((id) => id.trim()));
    expect(steps).toHaveLength(10);
  });

  it('counterbalances each notice together with its immediate ratings', () => {
    expect(assignedFirstSteps.slice(4, 8).map((step) => step.id)).toEqual([
      'visual_notice_review',
      'visual_notice_attitudes',
      'text_notice_review',
      'text_notice_attitudes'
    ]);
    expect(referenceFirstSteps.slice(4, 8).map((step) => step.id)).toEqual([
      'text_notice_review',
      'text_notice_attitudes',
      'visual_notice_review',
      'visual_notice_attitudes'
    ]);
  });

  it('labels the preference options by presentation while preserving semantic answer ids', () => {
    const assignedFirstPreference = assignedFirstSteps.find((step) => step.id === 'presentation_preference');
    const referenceFirstPreference = referenceFirstSteps.find((step) => step.id === 'presentation_preference');

    expect(assignedFirstPreference?.kind).toBe('single');
    expect(referenceFirstPreference?.kind).toBe('single');

    if (assignedFirstPreference?.kind !== 'single' || referenceFirstPreference?.kind !== 'single') {
      throw new Error('Expected preference steps');
    }

    expect(assignedFirstPreference.choices.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'prefer_visual_notice', label: 'Visual presentation' },
      { id: 'prefer_text_notice', label: 'Plain-text presentation' }
    ]);
    expect(referenceFirstPreference.choices.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'prefer_visual_notice', label: 'Visual presentation' },
      { id: 'prefer_text_notice', label: 'Plain-text presentation' }
    ]);
  });

  it('requires two focused interview responses without placeholder examples', () => {
    const feedbackStep = assignedFirstSteps.find((step) => step.id === 'open_response');
    expect(feedbackStep?.kind).toBe('text-group');

    if (feedbackStep?.kind !== 'text-group') {
      throw new Error('Expected final feedback step');
    }

    expect(feedbackStep.required).toBe(true);
    expect(feedbackStep.questions).toEqual([
      expect.objectContaining({
        id: 'notice_descriptions',
        required: true,
        minimumWords: 5
      }),
      expect.objectContaining({
        id: 'decision_influence',
        required: true,
        minimumWords: 5
      })
    ]);
    expect(feedbackStep.questions.every((question) => !('placeholder' in question))).toBe(true);
  });

  it('describes the comparison without revealing the expected effect', () => {
    const intro = assignedFirstSteps.find((step) => step.id === 'study_intro');
    const instructions = assignedFirstSteps.find((step) => step.id === 'notice_instructions');

    expect(intro?.prompt).toBe(
      'Optbot Assistant is a simulated artificial intelligence (AI) service. This study asks how people respond to two presentations of the same model-improvement notice.'
    );
    expect(intro?.kind).toBe('intro');
    if (intro?.kind === 'intro') {
      expect(intro.highlights).toContainEqual({ label: 'Focus', value: 'Model-improvement privacy notices' });
    }
    expect(instructions?.prompt).toBe(
      'Notice A and Notice B contain the same terms in the same order but differ in presentation. Their review order is set for this session.'
    );
  });

  it('sets a realistic participant time expectation', () => {
    const intro = assignedFirstSteps.find((step) => step.id === 'study_intro');
    expect(intro?.kind).toBe('intro');

    if (intro?.kind !== 'intro') {
      throw new Error('Expected study introduction');
    }

    expect(intro.highlights).toContainEqual({ label: 'Time', value: 'About 3–5 minutes' });
  });

  it('uses concrete shared notice copy without example language', () => {
    const noticeCopy = [
      noticeHeadline,
      noticeSummary,
      ...referenceNoticeSections.flatMap((section) => [section.label, section.body])
    ].join(' ');

    expect(noticeCopy).not.toMatch(/\bexample\b/i);
    expect(noticeCopy).toContain('Optbot Assistant');
    expect(noticeCopy).toContain('up to 90 days');
    expect(noticeCopy).toContain('deletion request');
  });

  it('keeps required choice steps answerable', () => {
    for (const step of assignedFirstSteps) {
      if (step.kind === 'single' && step.required) {
        expect(step.choices.length).toBeGreaterThan(1);
      }

      if (step.kind === 'context' && step.required) {
        expect(step.questions.length).toBeGreaterThan(0);
        for (const question of step.questions) {
          expect(question.choices?.length).toBeGreaterThan(1);
        }
      }

      if (step.kind === 'likert-group' && step.required) {
        expect(step.scale.map((choice) => choice.value)).toEqual([1, 2, 3, 4, 5]);
        expect(step.questions.length).toBeGreaterThan(0);
      }

      if (step.kind === 'notice-review' && step.required) {
        expect(step.acknowledgementLabel).toContain('reviewed');
      }
    }
  });

  it('asks the same four attitude questions immediately after each notice', () => {
    const ratingSteps = assignedFirstSteps.filter((step) => step.kind === 'likert-group');

    expect(ratingSteps.map((step) => [step.id, step.questions.map((question) => question.id)])).toEqual([
      [
        'visual_notice_attitudes',
        ['visual_willingness', 'visual_trust', 'visual_completeness', 'visual_ease_of_use']
      ],
      [
        'text_notice_attitudes',
        ['text_willingness', 'text_trust', 'text_completeness', 'text_ease_of_use']
      ]
    ]);
  });
  it('limits participant context to age and AI usage frequency', () => {
    const contextStep = assignedFirstSteps.find((step) => step.id === 'participant_context');

    expect(contextStep?.kind).toBe('context');
    if (contextStep?.kind !== 'context') {
      throw new Error('Expected participant context step');
    }

    expect(contextStep.questions.map((question) => question.id)).toEqual(['age_range', 'ai_usage_frequency']);
  });

  it('defines one fixed visual treatment with recorded design metadata', () => {
    expect(visualNoticeVariant).toMatchObject({
      id: 'icon-led-disclosure',
      format: 'visual_disclosure_ledger',
      visualDesignVariantId: 'disclosure-ledger-v5',
      designAttributes: {
        colorway: expect.any(String),
        iconStyle: expect.any(String),
        density: 'spacious',
        sectionEmphasis: expect.any(String),
        layout: expect.any(String)
      }
    });
  });
});
