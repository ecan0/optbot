import { describe, expect, it } from 'vitest';
import { studySteps } from './studyContent';

describe('study content', () => {
  it('uses stable unique step ids', () => {
    const ids = studySteps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((id) => id.trim()));
  });

  it('keeps required choice steps answerable', () => {
    for (const step of studySteps) {
      if (step.required && step.kind !== 'text') {
        expect(step.choices?.length).toBeGreaterThan(1);
      }
    }
  });
});
