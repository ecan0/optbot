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

  it('defines fixed notice variants with recorded design metadata', () => {
    expect(noticeVariants).toHaveLength(3);

    const ids = noticeVariants.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['plain-text-control', 'trust-cue-summary', 'transparency-flow']);

    for (const variant of noticeVariants) {
      expect(variant.assetSrc).toBeTruthy();
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
