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
  minimumWords?: number;
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
  noticeSurface: NoticeSurface;
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

export type NoticeSurface = 'assigned' | 'reference-text';
export type NoticePresentationOrder = 'assigned-first' | 'reference-first';
export type NoticeSlot = 'A' | 'B';

export type NoticeVariantId = 'icon-led-disclosure' | 'trust-cue-summary' | 'transparency-flow';

export type NoticeFormat = 'visual_disclosure_ledger' | 'visual_trust_cues' | 'visual_transparency_flow';

export type VisualDesignVariantId = 'disclosure-ledger-v5' | 'privacy-controls-v5' | 'data-journey-v5';

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


export type NoticeVariant = {
  id: NoticeVariantId;
  label: string;
  format: NoticeFormat;
  visualDesignVariantId: VisualDesignVariantId;
  designAttributes: VisualDesignAttributes;
};

export type ParticipantMetadata = {
  survey_flow_version: string;
  started_at: string;
  completed_at: string;
  user_agent?: string;
  notice_presentation_order: NoticePresentationOrder;
  assigned_notice_slot: NoticeSlot;
  shown_notice_variant: {
    notice_variant_id: NoticeVariantId;
    notice_variant_label: string;
    notice_format: NoticeFormat;
    visual_design_variant_id: VisualDesignVariantId;
    visual_design_attributes: VisualDesignAttributes;
    assignment_method: 'session-randomized-fixed';
  };
};
