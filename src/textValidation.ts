export const defaultMinimumResponseWords = 5;

export type TextResponseValidation = {
  isBlankEquivalent: boolean;
  isValid: boolean;
  wordCount: number;
};

const wordPattern = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
const blankEquivalentPattern = /^(?:(?:n\s*a|not applicable|none|nothing|no comments?|no answers?|skip|pass|nil|blank|unknown|unsure|idk|i do not know)(?:\s+|$))+$/i;
const emptyStatementPatterns = [
  /^(?:i\s+)?(?:have|had)\s+no\s+(?:concerns?|comments?|feedback|answers?)(?:\s+at\s+all)?$/i,
  /^(?:i\s+)?(?:do\s+not|don['’]?t)\s+have\s+(?:any\s+)?(?:concerns?|comments?|feedback|answers?)(?:\s+at\s+all)?$/i,
  /^no\s+(?:additional|further)\s+(?:information|details|comments?)\s+(?:is|are)\s+(?:needed|required)$/i
];

function normalizeResponse(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}'’]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function countResponseWords(value: string): number {
  return value.match(wordPattern)?.length ?? 0;
}

export function validateTextResponse(
  value: unknown,
  minimumWords = defaultMinimumResponseWords
): TextResponseValidation {
  if (typeof value !== 'string') {
    return { isBlankEquivalent: false, isValid: false, wordCount: 0 };
  }

  const normalized = normalizeResponse(value);
  const wordCount = countResponseWords(normalized);
  const isBlankEquivalent =
    blankEquivalentPattern.test(normalized) ||
    emptyStatementPatterns.some((pattern) => pattern.test(normalized));

  return {
    isBlankEquivalent,
    isValid: !isBlankEquivalent && wordCount >= minimumWords,
    wordCount
  };
}
