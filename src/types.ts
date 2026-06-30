export type Choice = {
  id: string;
  label: string;
  detail?: string;
  value?: number;
};

export type StudyStep = {
  id: string;
  eyebrow: string;
  title: string;
  prompt: string;
  kind: 'single' | 'likert' | 'text';
  required?: boolean;
  choices?: Choice[];
  placeholder?: string;
};

export type AnswerValue = string | number;
export type SurveyAnswers = Record<string, AnswerValue>;
