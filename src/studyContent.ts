import type { StudyStep } from './types';

export const consentVersion = 'consent-placeholder-v1';

export const studySteps: StudyStep[] = [
  {
    id: 'intro_consent',
    eyebrow: 'Welcome',
    title: 'A short planning study',
    prompt: 'Please confirm that you are at least 18 years old and agree to answer a few planning questions for this class project.',
    kind: 'single',
    required: true,
    choices: [
      { id: 'consent_yes', label: 'I agree to participate' },
      { id: 'consent_no', label: 'I do not agree' }
    ]
  },
  {
    id: 'coverage_priority',
    eyebrow: 'Priorities',
    title: 'What matters most when comparing options?',
    prompt: 'Choose the factor you would want a recommendation tool to weigh most heavily.',
    kind: 'single',
    required: true,
    choices: [
      { id: 'monthly_cost', label: 'Lower monthly cost', detail: 'Predictable bills and fewer surprises.' },
      { id: 'flexibility', label: 'More flexibility', detail: 'More room to choose providers or features.' },
      { id: 'guidance', label: 'Clearer guidance', detail: 'Plain-language help deciding what fits.' }
    ]
  },
  {
    id: 'confidence',
    eyebrow: 'Decision Fit',
    title: 'How confident would you feel choosing from three recommended options?',
    prompt: 'Use the scale below to rate your confidence.',
    kind: 'likert',
    required: true,
    choices: [
      { id: '1', label: 'Not confident', value: 1 },
      { id: '2', label: 'Slightly confident', value: 2 },
      { id: '3', label: 'Neutral', value: 3 },
      { id: '4', label: 'Confident', value: 4 },
      { id: '5', label: 'Very confident', value: 5 }
    ]
  },
  {
    id: 'explanation_style',
    eyebrow: 'Guidance Style',
    title: 'What kind of explanation would help most?',
    prompt: 'Share one sentence about what would make a recommendation feel trustworthy.',
    kind: 'text',
    required: false,
    placeholder: 'For example: show the tradeoffs clearly without too much jargon.'
  }
];
