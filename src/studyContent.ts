import type {
  LikertScaleChoice,
  NoticePresentationOrder,
  NoticeReviewStep,
  NoticeSection,
  NoticeVariant,
  SingleChoiceStep,
  StudyStep
} from './types';

export const surveyFlowVersion = 'paired-notice-attitudes-v0.6.5';
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
      'Optbot Assistant is a simulated artificial intelligence (AI) service. This study asks how two presentations of the same model-improvement notice affect trust and understanding.',
    kind: 'intro',
    highlights: [
      { label: 'Focus', value: 'Model-improvement notices' },
      { label: 'Time', value: 'About 2-3 minutes' },
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
    title: 'Share a little context before reviewing the notice.',
    prompt:
      'These questions help compare responses across adults from different communities without collecting direct personal identifiers.',
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
        id: 'participant_status',
        prompt: 'Current role',
        required: true,
        choices: [
          { id: 'student', label: 'Student' },
          { id: 'professional', label: 'Working professional' },
          { id: 'both_student_professional', label: 'Both' },
          { id: 'other_status', label: 'Another role' },
          { id: 'prefer_not_status', label: 'Prefer not to say' }
        ]
      },
      {
        id: 'ai_experience_level',
        prompt: 'Experience with AI tools',
        required: true,
        choices: [
          { id: 'none', label: 'No experience' },
          { id: 'tried_once', label: 'Tried once or twice' },
          { id: 'regular', label: 'Use sometimes' },
          { id: 'advanced', label: 'Use often or deeply' }
        ]
      },
      {
        id: 'ai_usage_frequency',
        prompt: 'How often do you use AI tools?',
        required: true,
        choices: [
          { id: 'rarely', label: 'Rarely' },
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
    title: 'Compare two layouts of the same privacy notice.',
    prompt:
      'Notice A and Notice B contain the same terms in the same order. Their layouts differ, and their review order is set for this session.',
    kind: 'instructions',
    callouts: [
      { label: 'Read every section', detail: 'Review what is shared, how Optbot uses it, and how long Optbot keeps it.' },
      { label: 'Compare the layouts', detail: 'Consider readability, trust, completeness, and ease of use.' },
      { label: 'Choose one notice', detail: 'After both reviews, select Notice A or Notice B.' }
    ]
  },
  {
    id: 'visual_notice_review',
    eyebrow: 'Assigned Notice',
    title: 'Review this privacy notice presentation.',
    prompt:
      'This is the notice condition assigned for this session. The assigned format and visual design are recorded with your response.',
    kind: 'notice-review',
    noticeSurface: 'assigned',
    required: true,
    acknowledgementLabel: 'I reviewed this notice presentation'
  },
  {
    id: 'text_notice_review',
    eyebrow: 'Reference Notice',
    title: 'Now review the same notice as text.',
    prompt:
      'This text version includes the same study intent so you can compare presentation style, clarity, and completeness.',
    kind: 'notice-review',
    noticeSurface: 'reference-text',
    required: true,
    acknowledgementLabel: 'I reviewed the text notice'
  },
  {
    id: 'presentation_preference',
    eyebrow: 'Preference',
    title: 'Which notice would you choose before deciding whether to share data?',
    prompt: 'Choose Notice A or Notice B.',
    kind: 'single',
    required: true,
    choices: [
      {
        id: 'prefer_assigned_notice',
        label: 'Assigned notice'
      },
      {
        id: 'prefer_text_notice',
        label: 'Reference notice'
      }
    ]
  },
  {
    id: 'notice_evaluation_clarity',
    eyebrow: 'Notice Ratings',
    title: 'Rate clarity, trust, and confidence.',
    prompt: 'Use a 1-5 scale for each statement.',
    kind: 'likert-group',
    required: true,
    scale: likertScale,
    questions: [
      {
        id: 'clarity_rating',
        label: 'The notice made it clear what data may be collected and used.',
        lowLabel: 'Not clear',
        highLabel: 'Very clear'
      },
      {
        id: 'trust_rating',
        label: 'The notice made the AI system feel trustworthy.',
        lowLabel: 'Low trust',
        highLabel: 'High trust'
      },
      {
        id: 'confidence_rating',
        label: 'I feel confident I understood what I would be agreeing to.',
        lowLabel: 'Not confident',
        highLabel: 'Very confident'
      }
    ]
  },
  {
    id: 'notice_evaluation_decision',
    eyebrow: 'Decision Ratings',
    title: 'Rate completeness and ease of use.',
    prompt: 'Use the same 1-5 scale for the final two questions.',
    kind: 'likert-group',
    required: true,
    scale: likertScale,
    questions: [
      {
        id: 'completeness_rating',
        label: 'The notice included enough information for me to make a decision.',
        lowLabel: 'Incomplete',
        highLabel: 'Complete'
      },
      {
        id: 'ease_of_use_rating',
        label: 'The notice was easy to scan and use.',
        lowLabel: 'Difficult',
        highLabel: 'Easy'
      }
    ]
  },
  {
    id: 'open_response',
    eyebrow: 'Feedback',
    title: 'Explain your decision.',
    prompt: 'Answer both questions in at least five words.',
    kind: 'text-group',
    required: true,
    questions: [
      {
        id: 'concerns_influenced_decision',
        label: 'What concerns influenced your decision?',
        helperText: 'Required · 5 words minimum',
        minimumWords: 5,
        required: true
      },
      {
        id: 'information_increase_trust',
        label: 'What information would make you more willing to participate?',
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
    eyebrow: `Notice ${slot}`,
    title: isFirst ? `Review privacy notice ${slot}.` : `Now review privacy notice ${slot}.`,
    prompt: `Read each section of Notice ${slot} before confirming your review.`,
    acknowledgementLabel: `I reviewed Notice ${slot}`
  };
}

function configurePreferenceStep(step: SingleChoiceStep): SingleChoiceStep {
  const assignedChoice = step.choices.find((choice) => choice.id === 'prefer_assigned_notice');
  const referenceChoice = step.choices.find((choice) => choice.id === 'prefer_text_notice');

  if (!assignedChoice || !referenceChoice) {
    throw new Error('Preference step must define assigned and reference notice choices.');
  }

  return {
    ...step,
    choices: [
      { ...assignedChoice, label: 'Notice A' },
      { ...referenceChoice, label: 'Notice B' }
    ]
  };
}

export function buildStudySteps(order: NoticePresentationOrder): StudyStep[] {
  const assignedIndex = studySteps.findIndex(
    (step) => step.kind === 'notice-review' && step.noticeSurface === 'assigned'
  );
  const referenceIndex = studySteps.findIndex(
    (step) => step.kind === 'notice-review' && step.noticeSurface === 'reference-text'
  );
  const assignedStep = studySteps[assignedIndex] as NoticeReviewStep;
  const referenceStep = studySteps[referenceIndex] as NoticeReviewStep;
  const orderedNoticeSteps =
    order === 'assigned-first'
      ? [configureNoticeStep(assignedStep, true), configureNoticeStep(referenceStep, false)]
      : [configureNoticeStep(referenceStep, true), configureNoticeStep(assignedStep, false)];

  const remainingSteps = studySteps.slice(referenceIndex + 1).map((step) =>
    step.kind === 'single' && step.id === 'presentation_preference' ? configurePreferenceStep(step) : step
  );

  return [
    ...studySteps.slice(0, assignedIndex),
    ...orderedNoticeSteps,
    ...remainingSteps
  ];
}
