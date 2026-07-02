import type { ResponsePayload } from './schema';
import { noticeVariants, surveyFlowVersion } from './studyContent';
import type { AnswerValue, NoticeVariant, NoticeVariantId, StudyStep, SurveyAnswers } from './types';

export const noticeVariantStorageKey = 'optbot_notice_variant';
export const reviewAcknowledgedValue = 'reviewed';

type VariantStore = Pick<Storage, 'getItem' | 'setItem'>;
type CryptoSource = Pick<Crypto, 'getRandomValues'>;

export function getChoiceAnswerValue(choice: { id: string; value?: AnswerValue }): AnswerValue {
  return choice.value ?? choice.id;
}

export function getNoticeVariantById(id: string | null | undefined): NoticeVariant | undefined {
  return noticeVariants.find((variant) => variant.id === id);
}

export function assignNoticeVariant(store: VariantStore, cryptoSource: CryptoSource): NoticeVariant {
  const storedVariant = getNoticeVariantById(store.getItem(noticeVariantStorageKey));
  if (storedVariant) {
    return storedVariant;
  }

  const randomValues = new Uint32Array(1);
  cryptoSource.getRandomValues(randomValues);
  const randomValue = randomValues[0];
  const variant = noticeVariants[randomValue % noticeVariants.length];
  store.setItem(noticeVariantStorageKey, variant.id);
  return variant;
}

export function isAnswerPresent(value: AnswerValue | undefined): boolean {
  return value !== undefined && value !== '';
}

export function isConsentDenied(answers: SurveyAnswers): boolean {
  return answers.participation_consent === 'consent_no';
}

export function isStepComplete(step: StudyStep, answers: SurveyAnswers): boolean {
  if (!step.required) {
    return true;
  }

  switch (step.kind) {
    case 'single':
      return isAnswerPresent(answers[step.id]);
    case 'context':
      return step.questions.every((question) => !question.required || isAnswerPresent(answers[question.id]));
    case 'notice-review':
      return answers[step.id] === reviewAcknowledgedValue;
    case 'likert-group': {
      const allowedValues = new Set(step.scale.map((choice) => choice.value));
      return step.questions.every((question) => {
        const answer = answers[question.id];
        return typeof answer === 'number' && allowedValues.has(answer);
      });
    }
    case 'text-group':
      return step.questions.every((question) => !question.required || isAnswerPresent(answers[question.id]));
    case 'intro':
    case 'instructions':
      return true;
    default:
      return true;
  }
}

export function getStepValidationMessage(step: StudyStep, answers: SurveyAnswers): string | null {
  if (isStepComplete(step, answers)) {
    return null;
  }

  switch (step.kind) {
    case 'context':
      return 'Please answer each required context question before continuing.';
    case 'notice-review':
      return 'Please confirm that you reviewed the notice before continuing.';
    case 'likert-group':
      return 'Please choose a 1-5 rating for each required item.';
    case 'single':
      return 'Please choose an answer before continuing.';
    default:
      return 'Please complete the required fields before continuing.';
  }
}

export function createShownNoticeVariantMetadata(variant: NoticeVariant): ResponsePayload['metadata']['shown_notice_variant'] {
  return {
    notice_variant_id: variant.id,
    notice_variant_label: variant.label,
    notice_format: variant.format,
    visual_design_variant_id: variant.visualDesignVariantId,
    visual_design_attributes: variant.designAttributes,
    assignment_method: 'session-randomized-fixed'
  };
}

export function buildResponsePayload(args: {
  surveyId: string;
  consentVersion: string;
  answers: SurveyAnswers;
  variant: NoticeVariant;
  startedAt: string;
  completedAt: string;
  userAgent?: string;
}): ResponsePayload {
  return {
    survey_id: args.surveyId,
    variant_id: args.variant.id as NoticeVariantId,
    consent_version: args.consentVersion,
    answers: args.answers,
    metadata: {
      survey_flow_version: surveyFlowVersion,
      started_at: args.startedAt,
      completed_at: args.completedAt,
      user_agent: args.userAgent,
      shown_notice_variant: createShownNoticeVariantMetadata(args.variant)
    }
  };
}
