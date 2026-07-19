import { describe, expect, it } from 'vitest';
import { countResponseWords, validateTextResponse } from './textValidation';

describe('text response validation', () => {
  it('counts natural words across punctuation and line breaks', () => {
    expect(countResponseWords("Deletion controls aren't clear\nenough yet.")).toBe(6);
  });

  it.each([
    '',
    '   ',
    'N/A',
    'none',
    'none none none none none',
    'no comment',
    'I do not have any concerns',
    'No additional information is needed'
  ])('rejects empty or blank-equivalent feedback: %s', (response) => {
    expect(validateTextResponse(response, 5).isValid).toBe(false);
  });

  it('rejects substantive responses shorter than five words', () => {
    expect(validateTextResponse('Deletion timing needs clarification', 5)).toMatchObject({
      isBlankEquivalent: false,
      isValid: false,
      wordCount: 4
    });
  });

  it.each([
    'Deletion timing needs much more clarification.',
    'Nothing would make me willing to participate.'
  ])('accepts a substantive response of at least five words: %s', (response) => {
    expect(validateTextResponse(response, 5).isValid).toBe(true);
  });
});
