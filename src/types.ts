export type AnswerValue = string | number;
export type SurveyAnswers = Record<string, AnswerValue>;

export type Choice = {
  id: string;
  label: string;
  detail?: string;
  value?: AnswerValue;
};

export type ChoiceQuestion = {
  id: string;
  prompt: string;
  helperText?: string;
  required?: boolean;
  choices?: Choice[];
};

export type LikertScaleChoice = {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
};

export type LikertQuestion = {
  id: string;
  label: string;
  lowLabel: string;
  highLabel: string;
};

export type TextQuestion = {
  id: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
};

type BaseStep = {
  id: string;
  eyebrow: string;
  title: string;
  prompt: string;
  required?: boolean;
};

export type IntroStep = BaseStep & {
  kind: 'intro';
  illustrationAsset: string;
  highlights: Array<{
    label: string;
    value: string;
  }>;
};

export type SingleChoiceStep = BaseStep & {
  kind: 'single';
  choices: Choice[];
};

export type ContextStep = BaseStep & {
  kind: 'context';
  questions: ChoiceQuestion[];
};

export type InstructionsStep = BaseStep & {
  kind: 'instructions';
  callouts: Array<{
    label: string;
    detail: string;
  }>;
};

export type NoticeReviewStep = BaseStep & {
  kind: 'notice-review';
  noticeSurface: 'assigned' | 'reference-text';
  acknowledgementLabel: string;
};

export type LikertGroupStep = BaseStep & {
  kind: 'likert-group';
  questions: LikertQuestion[];
  scale: LikertScaleChoice[];
};

export type TextGroupStep = BaseStep & {
  kind: 'text-group';
  questions: TextQuestion[];
};

export type StudyStep =
  | IntroStep
  | SingleChoiceStep
  | ContextStep
  | InstructionsStep
  | NoticeReviewStep
  | LikertGroupStep
  | TextGroupStep;

export type NoticeVariantId = 'plain-text-control' | 'trust-cue-summary' | 'transparency-flow';

export type NoticeFormat = 'plain_text' | 'visual_trust_cues' | 'visual_transparency_flow';

export type VisualDesignVariantId = 'legal-plain' | 'benefit-badges' | 'data-flow-timeline';

export type VisualDesignAttributes = {
  colorway: string;
  iconStyle: string;
  density: string;
  sectionEmphasis: string;
  layout: string;
};

export type NoticeSection = {
  id: string;
  label: string;
  body: string;
  icon: 'database' | 'shield' | 'user-check' | 'trash' | 'sparkles' | 'file-text';
};

export type NoticeBadge = {
  label: string;
  detail: string;
  icon: 'lock' | 'user-check' | 'trash' | 'file-text' | 'sparkles';
};

export type NoticeFlowStep = {
  label: string;
  detail: string;
};

export type NoticeVariant = {
  id: NoticeVariantId;
  label: string;
  format: NoticeFormat;
  visualDesignVariantId: VisualDesignVariantId;
  designAttributes: VisualDesignAttributes;
  headline: string;
  summary: string;
  assetAlt: string;
  assetSrc: string;
  badges?: NoticeBadge[];
  flow?: NoticeFlowStep[];
};

export type ParticipantMetadata = {
  survey_flow_version: string;
  started_at: string;
  completed_at: string;
  user_agent?: string;
  shown_notice_variant: {
    notice_variant_id: NoticeVariantId;
    notice_variant_label: string;
    notice_format: NoticeFormat;
    visual_design_variant_id: VisualDesignVariantId;
    visual_design_attributes: VisualDesignAttributes;
    assignment_method: 'session-randomized-fixed';
  };
};
