import consentDashboard from './assets/illustrations/consent-dashboard.svg';
import plainTextNotice from './assets/notices/plain-text-notice.svg';
import transparencyFlowNotice from './assets/notices/transparency-flow-notice.svg';
import trustCueNotice from './assets/notices/trust-cue-notice.svg';
import type { LikertScaleChoice, NoticeSection, NoticeVariant, StudyStep } from './types';

export const surveyFlowVersion = 'privacy-notice-comparison-v1';
export const consentVersion = 'ai-training-consent-v1';

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
    label: 'Information that may be used',
    icon: 'database',
    body:
      'If you opt in, the example AI assistant may use prompts, uploaded content, chat interactions, feedback, and basic usage signals to improve future AI systems.'
  },
  {
    id: 'training_use',
    label: 'How the information may be used',
    icon: 'sparkles',
    body:
      'Shared information may be reviewed, grouped with other participant data, and used to improve model responses, safety testing, and product quality.'
  },
  {
    id: 'privacy_protections',
    label: 'Privacy protections',
    icon: 'shield',
    body:
      'The notice says personal information should be removed or separated where possible before content is used for training or evaluation.'
  },
  {
    id: 'participant_control',
    label: 'Participant control',
    icon: 'trash',
    body:
      'The notice says participation is voluntary and users should be able to decline data sharing or request deletion when the service provides that control.'
  }
];

export const noticeVariants: NoticeVariant[] = [
  {
    id: 'plain-text-control',
    label: 'Plain text consent notice',
    format: 'plain_text',
    visualDesignVariantId: 'legal-plain',
    designAttributes: {
      colorway: 'ink and paper',
      iconStyle: 'none',
      density: 'dense',
      sectionEmphasis: 'paragraph-first',
      layout: 'single-column legal notice'
    },
    headline: 'Data sharing for AI improvement',
    summary:
      'A traditional consent notice with the same information presented mostly as paragraphs and section headings.',
    assetAlt: 'Plain text notice preview',
    assetSrc: plainTextNotice
  },
  {
    id: 'trust-cue-summary',
    label: 'Privacy cue summary',
    format: 'visual_trust_cues',
    visualDesignVariantId: 'benefit-badges',
    designAttributes: {
      colorway: 'teal, blue, and amber',
      iconStyle: 'outline privacy badges',
      density: 'balanced',
      sectionEmphasis: 'protections-first',
      layout: 'benefit-card summary grid'
    },
    headline: 'Your privacy controls at a glance',
    summary:
      'A benefit-style notice that uses icons, badges, and short summary rows to highlight privacy protections.',
    assetAlt: 'Privacy badge notice preview',
    assetSrc: trustCueNotice,
    badges: [
      { label: 'Encrypted', detail: 'Protected while stored or transferred.', icon: 'lock' },
      { label: 'Personal details removed', detail: 'Identifying details are separated where possible.', icon: 'user-check' },
      { label: 'Delete controls', detail: 'Users can look for deletion options.', icon: 'trash' },
      { label: 'Transparent usage', detail: 'The notice states how shared data is used.', icon: 'file-text' },
      { label: 'AI training', detail: 'Use is connected to model improvement.', icon: 'sparkles' }
    ]
  },
  {
    id: 'transparency-flow',
    label: 'Transparency flow notice',
    format: 'visual_transparency_flow',
    visualDesignVariantId: 'data-flow-timeline',
    designAttributes: {
      colorway: 'blue, plum, green, and gold',
      iconStyle: 'numbered process markers',
      density: 'guided',
      sectionEmphasis: 'data journey',
      layout: 'timeline with checkpoint panels'
    },
    headline: 'See where shared data goes',
    summary:
      'A transparency-focused notice that shows the path from user content to privacy review to model improvement.',
    assetAlt: 'Transparency flow notice preview',
    assetSrc: transparencyFlowNotice,
    flow: [
      { label: 'User content shared', detail: 'Prompts, uploads, feedback, and interactions enter the improvement process.' },
      { label: 'Personal information separated', detail: 'Identifying details are removed or separated where possible.' },
      { label: 'Training dataset prepared', detail: 'Reviewed content is grouped with other data for model improvement.' },
      { label: 'AI systems improved', detail: 'The information helps improve quality, safety, and reliability.' },
      { label: 'Controls remain available', detail: 'The notice points users toward opt-out and deletion controls.' }
    ]
  }
];

export const studySteps: StudyStep[] = [
  {
    id: 'study_intro',
    eyebrow: 'Welcome',
    title: 'Review AI privacy notices as if you were enrolling in a service.',
    prompt:
      'This short study asks how different privacy notice presentations affect trust, comfort, and willingness to share data for AI training.',
    kind: 'intro',
    illustrationAsset: consentDashboard,
    highlights: [
      { label: 'Focus', value: 'AI consent notices' },
      { label: 'Time', value: 'About 4-6 minutes' },
      { label: 'Data', value: 'Basic demographics only' }
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
    eyebrow: 'Review Task',
    title: 'Compare the notice like a benefits plan summary.',
    prompt:
      'You will review one assigned privacy notice presentation and then a standard text version with the same intent. Pay attention to clarity, trust, completeness, and ease of use.',
    kind: 'instructions',
    callouts: [
      { label: 'Look for data use', detail: 'What information may be shared and why it may be used.' },
      { label: 'Look for protections', detail: 'How the notice describes privacy safeguards and control.' },
      { label: 'Trust your reaction', detail: 'Answer based on how the presentation affects your confidence.' }
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
    title: 'Which notice presentation would you prefer before deciding whether to share data?',
    prompt: 'Choose the option that would best support your decision.',
    kind: 'single',
    required: true,
    choices: [
      {
        id: 'prefer_assigned_notice',
        label: 'The assigned notice presentation',
        detail: 'The first notice format helped me decide.'
      },
      {
        id: 'prefer_text_notice',
        label: 'The text notice',
        detail: 'The written notice helped me decide.'
      },
      {
        id: 'prefer_both_together',
        label: 'Both together',
        detail: 'The combination would work best.'
      },
      {
        id: 'prefer_not_sure',
        label: 'Not sure',
        detail: 'I do not have a clear preference.'
      }
    ]
  },
  {
    id: 'notice_evaluation',
    eyebrow: 'Follow-Up Ratings',
    title: 'Rate the notice experience.',
    prompt: 'Use a 1-5 scale for each statement or question.',
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
      },
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
      },
      {
        id: 'comfort_sharing',
        label: 'How comfortable would you be sharing your data to improve this AI system?',
        lowLabel: 'Very uncomfortable',
        highLabel: 'Very comfortable'
      },
      {
        id: 'willingness_to_share',
        label: 'I would be willing to share data under the terms shown in the notice.',
        lowLabel: 'Unwilling',
        highLabel: 'Very willing'
      }
    ]
  },
  {
    id: 'open_response',
    eyebrow: 'Rationale',
    title: 'Share any privacy concerns or missing information.',
    prompt: 'These optional responses help explain the rating patterns in the study results.',
    kind: 'text-group',
    questions: [
      {
        id: 'concerns_influenced_decision',
        label: 'What concerns influenced your decision?',
        placeholder: 'For example: data misuse, surveillance, unclear deletion, or ownership concerns.'
      },
      {
        id: 'information_increase_trust',
        label: 'What information would make you more willing to participate?',
        placeholder: 'For example: clearer deletion controls, examples of data use, or proof of anonymization.'
      }
    ]
  }
];
