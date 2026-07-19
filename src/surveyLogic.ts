import type { ResponsePayload } from './schema';
import { noticeVariants, surveyFlowVersion } from './studyContent';
import { validateTextResponse } from './textValidation';
import type {
  AnswerValue,
  NoticePresentationOrder,
  NoticeSlot,
  NoticeSurface,
  NoticeVariant,
  StudyStep,
  SurveyAnswers
} from './types';

export const noticeVariantStorageKey = 'optbot_notice_variant';
export const noticeOrderStorageKey = 'optbot_notice_order';
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

export function assignNoticePresentationOrder(
  store: VariantStore,
  cryptoSource: CryptoSource
): NoticePresentationOrder {
  const storedOrder = store.getItem(noticeOrderStorageKey);
  if (storedOrder === 'assigned-first' || storedOrder === 'reference-first') {
    return storedOrder;
  }

  const randomValues = new Uint32Array(1);
  cryptoSource.getRandomValues(randomValues);
  const order = randomValues[0] % 2 === 0 ? 'assigned-first' : 'reference-first';
  store.setItem(noticeOrderStorageKey, order);
  return order;
}

export function getNoticeSlot(surface: NoticeSurface): NoticeSlot {
  return surface === 'assigned' ? 'A' : 'B';
}

export function getStepCompletion(
  step: StudyStep,
  answers: SurveyAnswers
): { completed: number; total: number } {
  if (!step.required) {
    return { completed: 0, total: 0 };
  }

  switch (step.kind) {
    case 'single':
      return { completed: isAnswerPresent(answers[step.id]) ? 1 : 0, total: 1 };
    case 'context': {
      const requiredQuestions = step.questions.filter((question) => question.required);
      return {
        completed: requiredQuestions.filter((question) => isAnswerPresent(answers[question.id])).length,
        total: requiredQuestions.length
      };
    }
    case 'notice-review':
      return {
        completed: answers[step.id] === reviewAcknowledgedValue ? 1 : 0,
        total: 1
      };
    case 'likert-group': {
      const allowedValues = new Set(step.scale.map((choice) => choice.value));
      return {
        completed: step.questions.filter((question) => {
          const answer = answers[question.id];
          return typeof answer === 'number' && allowedValues.has(answer);
        }).length,
        total: step.questions.length
      };
    }
    case 'text-group': {
      const requiredQuestions = step.questions.filter((question) => question.required);
      return {
        completed: requiredQuestions.filter((question) =>
          validateTextResponse(answers[question.id], question.minimumWords ?? 1).isValid
        ).length,
        total: requiredQuestions.length
      };
    }
    case 'intro':
    case 'instructions':
      return { completed: 0, total: 0 };
  }
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

  const completion = getStepCompletion(step, answers);
  return completion.completed === completion.total;
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
    case 'text-group':
      return 'Enter at least five substantive words for each required response.';
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
  noticeOrder: NoticePresentationOrder;
  startedAt: string;
  completedAt: string;
  userAgent?: string;
}): ResponsePayload {
  return {
    survey_id: args.surveyId,
    variant_id: args.variant.id,
    consent_version: args.consentVersion,
    answers: args.answers,
    metadata: {
      survey_flow_version: surveyFlowVersion,
      started_at: args.startedAt,
      completed_at: args.completedAt,
      user_agent: args.userAgent,
      notice_presentation_order: args.noticeOrder,
      assigned_notice_slot: getNoticeSlot('assigned'),
      shown_notice_variant: createShownNoticeVariantMetadata(args.variant)
    }
  };
}
