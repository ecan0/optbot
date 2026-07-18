import { describe, expect, it } from 'vitest';
import { noticeVariants, studySteps } from './studyContent';

describe('study content', () => {
  it('uses stable unique step ids', () => {
    const ids = studySteps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((id) => id.trim()));
  });

  it('keeps required choice steps answerable', () => {
    for (const step of studySteps) {
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

  it('keeps the rating set focused on distinct outcomes', () => {
    const ratingStep = studySteps.find((step) => step.id === 'notice_evaluation');

    if (!ratingStep || ratingStep.kind !== 'likert-group') {
      throw new Error('Notice evaluation must be a Likert group');
    }

    expect(ratingStep.questions.map((question) => question.id)).toEqual([
      'clarity_rating',
      'trust_rating',
      'confidence_rating',
      'completeness_rating',
      'ease_of_use_rating'
    ]);
  });

  it('defines fixed notice variants with recorded design metadata', () => {
    expect(noticeVariants).toHaveLength(3);

    const ids = noticeVariants.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['plain-text-control', 'trust-cue-summary', 'transparency-flow']);
    expect(noticeVariants.map((variant) => variant.visualDesignVariantId)).toEqual([
      'disclosure-ledger-v2',
      'privacy-controls-v2',
      'data-journey-v2'
    ]);

    for (const variant of noticeVariants) {
      expect(variant.format).toBeTruthy();
      expect(variant.visualDesignVariantId).toBeTruthy();
      expect(variant.designAttributes).toMatchObject({
        colorway: expect.any(String),
        iconStyle: expect.any(String),
        density: expect.any(String),
        sectionEmphasis: expect.any(String),
        layout: expect.any(String)
      });
    }
  });
});
