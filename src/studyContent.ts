import type {
  LikertScaleChoice,
  NoticePresentationOrder,
  NoticeReviewStep,
  NoticeSection,
  NoticeVariant,
  StudyStep
} from './types';

export const surveyFlowVersion = 'paired-notice-attitudes-v1.0.0';
export const consentVersion = 'ai-training-consent-v1';
export const noticeHeadline = 'Optbot Assistant model-improvement notice';
export const noticeSummary =
  'Effective July 18, 2026. If you choose Share, Optbot may use content from this session to improve Optbot Assistant.';

export const likertScale: LikertScaleChoice[] = [
  { id: '1', label: '1', shortLabel: '1', value: 1 },
  { id: '2', label: '2', shortLabel: '2', value: 2 },
  { id: '3', label: '3', shortLabel: '3', value: 3 },
  { id: '4', label: '4', shortLabel: '4', value: 4 },
  { id: '5', label: '5', shortLabel: '5', value: 5 }
];

export const referenceNoticeSections: NoticeSection[] = [
  {
    id: 'data_collected',
    label: 'Content covered by this choice',
    icon: 'database',
    body:
      'If you choose Share, Optbot sends this session’s prompts, uploaded files, assistant replies, feedback, and technical event data to its model-improvement program.'
  },
  {
    id: 'training_use',
    label: 'How the content is used',
    icon: 'sparkles',
    body:
      'Authorized research and engineering teams may review this content. They may use it to train, evaluate, and safety-test future models. Optbot does not use it to personalize advertising.'
  },
  {
    id: 'privacy_protections',
    label: 'Privacy safeguards and limits',
    icon: 'shield',
    body:
      'Automated filters check for direct identifiers, including names, email addresses, phone numbers, and account IDs, before training. Some identifiers may remain. Do not submit sensitive information.'
  },
  {
    id: 'participant_control',
    label: 'Retention and your controls',
    icon: 'trash',
    body:
      'You can decline sharing without losing access to Optbot Assistant. Optbot keeps source content for up to 90 days for review. You may submit a deletion request through the service privacy request form.'
  }
];


export const visualNoticeVariant: NoticeVariant = {
  id: 'icon-led-disclosure',
  label: 'Icon-led disclosure',
  format: 'visual_disclosure_ledger',
  visualDesignVariantId: 'disclosure-ledger-v5',
  designAttributes: {
    colorway: 'charcoal, ivory, and periwinkle',
    iconStyle: 'large monoline section symbols',
    density: 'spacious',
    sectionEmphasis: 'four equal disclosure sections',
    layout: 'vertical icon-led disclosure'
  }
};

const studySteps: StudyStep[] = [
  {
    id: 'study_intro',
    eyebrow: 'Welcome',
    title: 'Review two privacy notices for a simulated Optbot Assistant service.',
    prompt:
      'Optbot Assistant is a simulated artificial intelligence (AI) service. This study asks how people respond to two presentations of the same model-improvement notice.',
    kind: 'intro',
    highlights: [
      { label: 'Focus', value: 'Model-improvement privacy notices' },
      { label: 'Time', value: 'About 3–5 minutes' },
      { label: 'Data', value: 'Survey answers' }
    ]
  },
  {
    id: 'participation_consent',
    eyebrow: 'Participation',
    title: 'Confirm that you want to participate.',
    prompt:
      'Participation is voluntary. Please confirm that you are at least 18 years old and agree to answer this study survey.',
    kind: 'single',
    required: true,
    choices: [
      { id: 'consent_yes', label: 'I agree to participate', detail: 'Continue to the study questions.' },
      { id: 'consent_no', label: 'I do not agree', detail: 'Exit without submitting a response.' }
    ]
  },
  {
    id: 'participant_context',
    eyebrow: 'About You',
    title: 'Share a little context before reviewing the notices.',
    prompt:
      'These two questions provide basic context without collecting direct personal identifiers.',
    kind: 'context',
    required: true,
    questions: [
      {
        id: 'age_range',
        prompt: 'Age range',
        required: true,
        choices: [
          { id: '18_24', label: '18-24' },
          { id: '25_34', label: '25-34' },
          { id: '35_44', label: '35-44' },
          { id: '45_54', label: '45-54' },
          { id: '55_65', label: '55-65' },
          { id: 'prefer_not_age', label: 'Prefer not to say' }
        ]
      },
      {
        id: 'ai_usage_frequency',
        prompt: 'How often do you use AI tools?',
        required: true,
        choices: [
          { id: 'rarely', label: 'Never or almost never' },
          { id: 'monthly', label: 'Monthly' },
          { id: 'weekly', label: 'Weekly' },
          { id: 'daily', label: 'Daily' }
        ]
      }
    ]
  },
  {
    id: 'notice_instructions',
    eyebrow: 'Review task',
    title: 'Compare two presentations of the same privacy notice.',
    prompt:
      'Notice A and Notice B contain the same terms in the same order but differ in presentation. Their review order is set for this session.',
    kind: 'instructions',
    callouts: [
      { label: 'Review a notice', detail: 'Read what is shared, how Optbot uses it, and how long Optbot keeps it.' },
      { label: 'Rate it', detail: 'Answer the same four questions immediately after each notice.' },
      { label: 'Compare both', detail: 'Choose the presentation you prefer, then briefly explain your decision.' }
    ]
  },
  {
    id: 'visual_notice_review',
    eyebrow: 'Notice A',
    title: 'Review privacy notice A.',
    prompt: 'Read each section of Notice A before confirming your review.',
    kind: 'notice-review',
    noticeSurface: 'assigned',
    required: true,
    acknowledgementLabel: 'I reviewed Notice A'
  },
  {
    id: 'visual_notice_attitudes',
    eyebrow: 'Notice A Ratings',
    title: 'Rate Notice A.',
    prompt: 'Answer based only on the notice you just reviewed.',
    kind: 'likert-group',
    required: true,
    scale: likertScale,
    questions: [
      {
        id: 'visual_willingness',
        label: 'I would be willing to share my session data under this notice.',
        lowLabel: 'Not willing',
        highLabel: 'Very willing'
      },
      {
        id: 'visual_trust',
        label: 'This notice made the AI system feel trustworthy.',
        lowLabel: 'Low trust',
        highLabel: 'High trust'
      },
      {
        id: 'visual_completeness',
        label: 'This notice included enough information for me to make a decision.',
        lowLabel: 'Incomplete',
        highLabel: 'Complete'
      },
      {
        id: 'visual_ease_of_use',
        label: 'This notice was easy to scan and use.',
        lowLabel: 'Difficult',
        highLabel: 'Easy'
      }
    ]
  },
  {
    id: 'text_notice_review',
    eyebrow: 'Notice B',
    title: 'Review privacy notice B.',
    prompt: 'Read each section of Notice B before confirming your review.',
    kind: 'notice-review',
    noticeSurface: 'reference-text',
    required: true,
    acknowledgementLabel: 'I reviewed Notice B'
  },
  {
    id: 'text_notice_attitudes',
    eyebrow: 'Notice B Ratings',
    title: 'Rate Notice B.',
    prompt: 'Answer based only on the notice you just reviewed.',
    kind: 'likert-group',
    required: true,
    scale: likertScale,
    questions: [
      {
        id: 'text_willingness',
        label: 'I would be willing to share my session data under this notice.',
        lowLabel: 'Not willing',
        highLabel: 'Very willing'
      },
      {
        id: 'text_trust',
        label: 'This notice made the AI system feel trustworthy.',
        lowLabel: 'Low trust',
        highLabel: 'High trust'
      },
      {
        id: 'text_completeness',
        label: 'This notice included enough information for me to make a decision.',
        lowLabel: 'Incomplete',
        highLabel: 'Complete'
      },
      {
        id: 'text_ease_of_use',
        label: 'This notice was easy to scan and use.',
        lowLabel: 'Difficult',
        highLabel: 'Easy'
      }
    ]
  },
  {
    id: 'presentation_preference',
    eyebrow: 'Preference',
    title: 'Which notice would you prefer before deciding whether to share data?',
    prompt: 'Choose Notice A or Notice B.',
    kind: 'single',
    required: true,
    choices: [
      {
        id: 'prefer_visual_notice',
        label: 'Visual presentation'
      },
      {
        id: 'prefer_text_notice',
        label: 'Plain-text presentation'
      }
    ]
  },
  {
    id: 'open_response',
    eyebrow: 'Interview Responses',
    title: 'Describe your reactions.',
    prompt: 'Use your own words. Answer both questions in at least five words each.',
    kind: 'text-group',
    required: true,
    questions: [
      {
        id: 'notice_descriptions',
        label: 'What words or short phrases would you use to describe Notice A and Notice B?',
        helperText: 'Mention both notices · Required · 5 words minimum',
        minimumWords: 5,
        required: true
      },
      {
        id: 'decision_influence',
        label: 'What most influenced your willingness or unwillingness to share?',
        helperText: 'Required · 5 words minimum',
        minimumWords: 5,
        required: true
      }
    ]
  }
];

function configureNoticeStep(step: NoticeReviewStep, isFirst: boolean): NoticeReviewStep {
  const slot = step.noticeSurface === 'assigned' ? 'A' : 'B';

  return {
    ...step,
    title: isFirst ? `Review privacy notice ${slot}.` : `Now review privacy notice ${slot}.`
  };
}


export function buildStudySteps(order: NoticePresentationOrder): StudyStep[] {
  const visualReviewIndex = studySteps.findIndex((step) => step.id === 'visual_notice_review');
  const visualRatingIndex = studySteps.findIndex((step) => step.id === 'visual_notice_attitudes');
  const textReviewIndex = studySteps.findIndex((step) => step.id === 'text_notice_review');
  const textRatingIndex = studySteps.findIndex((step) => step.id === 'text_notice_attitudes');
  const visualReview = studySteps[visualReviewIndex] as NoticeReviewStep;
  const textReview = studySteps[textReviewIndex] as NoticeReviewStep;
  const visualBlock = [configureNoticeStep(visualReview, order === 'assigned-first'), studySteps[visualRatingIndex]];
  const textBlock = [configureNoticeStep(textReview, order === 'reference-first'), studySteps[textRatingIndex]];
  const orderedNoticeBlocks = order === 'assigned-first' ? [...visualBlock, ...textBlock] : [...textBlock, ...visualBlock];
  const remainingSteps = studySteps.slice(textRatingIndex + 1);

  return [...studySteps.slice(0, visualReviewIndex), ...orderedNoticeBlocks, ...remainingSteps];
}
