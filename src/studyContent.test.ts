import { describe, expect, it } from 'vitest';
import { buildStudySteps, noticeVariants } from './studyContent';

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

  it('counterbalances only the two notice review steps', () => {
    const assignedFirstNoticeSteps = assignedFirstSteps.filter((step) => step.kind === 'notice-review');
    const referenceFirstNoticeSteps = referenceFirstSteps.filter((step) => step.kind === 'notice-review');

    expect(assignedFirstNoticeSteps.map((step) => [step.noticeSurface, step.eyebrow])).toEqual([
      ['assigned', 'Notice A'],
      ['reference-text', 'Notice B']
    ]);
    expect(referenceFirstNoticeSteps.map((step) => [step.noticeSurface, step.eyebrow])).toEqual([
      ['reference-text', 'Notice A'],
      ['assigned', 'Notice B']
    ]);
    expect(referenceFirstSteps.filter((step) => step.kind !== 'notice-review').map((step) => step.id)).toEqual(
      assignedFirstSteps.filter((step) => step.kind !== 'notice-review').map((step) => step.id)
    );
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

  it('splits five rating outcomes into focused three- and two-item steps', () => {
    const ratingSteps = assignedFirstSteps.filter((step) => step.kind === 'likert-group');

    expect(ratingSteps.map((step) => [step.id, step.questions.map((question) => question.id)])).toEqual([
      [
        'notice_evaluation_clarity',
        ['clarity_rating', 'trust_rating', 'confidence_rating']
      ],
      [
        'notice_evaluation_decision',
        ['completeness_rating', 'ease_of_use_rating']
      ]
    ]);
  });

  it('defines fixed notice variants with recorded v3 design metadata', () => {
    expect(noticeVariants).toHaveLength(3);

    const ids = noticeVariants.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['plain-text-control', 'trust-cue-summary', 'transparency-flow']);
    expect(noticeVariants.map((variant) => variant.visualDesignVariantId)).toEqual([
      'disclosure-ledger-v3',
      'privacy-controls-v3',
      'data-journey-v3'
    ]);
    expect(noticeVariants.map((variant) => variant.treatmentItems)).toEqual([
      noticeVariants[0].treatmentItems,
      noticeVariants[0].treatmentItems,
      noticeVariants[0].treatmentItems
    ]);
    expect(noticeVariants[0].treatmentItems).toHaveLength(3);

    for (const variant of noticeVariants) {
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
