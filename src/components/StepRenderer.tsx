import type { ReactNode } from 'react';
import { getNoticeSlot, getStepCompletion, reviewAcknowledgedValue, getChoiceAnswerValue } from '../surveyLogic';
import { validateTextResponse } from '../textValidation';
import type {
  AnswerValue,
  Choice,
  ChoiceQuestion,
  NoticeReviewStep,
  NoticePresentationOrder,
  NoticeSurface,
  NoticeVariant,
  TextQuestion,
  StudyStep,
  SurveyAnswers
} from '../types';
import { NoticeIdentityBadge, NoticePresentation } from './NoticePresentation';

type StepRendererProps = {
  step: StudyStep;
  answers: SurveyAnswers;
  assignedVariant: NoticeVariant;
  noticeOrder: NoticePresentationOrder;
  onAnswer: (answerId: string, value: AnswerValue) => void;
};

function isSelected(answer: AnswerValue | undefined, choice: Choice): boolean {
  return answer === getChoiceAnswerValue(choice);
}

function ChoiceButton({
  choice,
  identity,
  selected,
  onSelect
}: {
  choice: Choice;
  identity?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={selected ? 'choice-card selected' : 'choice-card'}
      type="button"
      onClick={onSelect}
    >
      {identity}
      <span className="choice-title">{choice.label}</span>
      {choice.detail ? <span className="choice-detail">{choice.detail}</span> : null}
    </button>
  );
}

function ChoiceQuestionGroup({
  question,
  answers,
  onAnswer
}: {
  question: ChoiceQuestion;
  answers: SurveyAnswers;
  onAnswer: (answerId: string, value: AnswerValue) => void;
}) {
  return (
    <fieldset className="question-group">
      <legend>{question.prompt}</legend>
      {question.helperText ? <p>{question.helperText}</p> : null}
      <div className="compact-choice-grid">
        {question.choices?.map((choice) => (
          <ChoiceButton
            choice={choice}
            key={choice.id}
            selected={isSelected(answers[question.id], choice)}
            onSelect={() => onAnswer(question.id, getChoiceAnswerValue(choice))}
          />
        ))}
      </div>
    </fieldset>
  );
}

function TextQuestionField({
  question,
  answer,
  onAnswer
}: {
  question: TextQuestion;
  answer: AnswerValue | undefined;
  onAnswer: (answerId: string, value: AnswerValue) => void;
}) {
  const value = typeof answer === 'string' ? answer : '';
  const minimumWords = question.minimumWords ?? 1;
  const validation = validateTextResponse(value, minimumWords);
  const helperId = `${question.id}-helper`;
  const statusId = `${question.id}-status`;
  let statusMessage = `${validation.wordCount} of ${minimumWords} words`;

  if (validation.isBlankEquivalent) {
    statusMessage = 'Use a specific response; no-response phrases do not count.';
  } else if (validation.wordCount > 0 && !validation.isValid) {
    const remainingWords = minimumWords - validation.wordCount;
    statusMessage = `${remainingWords} more ${remainingWords === 1 ? 'word' : 'words'} required`;
  } else if (validation.isValid) {
    statusMessage = `${validation.wordCount} words · Minimum met`;
  }

  return (
    <div className="text-question">
      <label htmlFor={question.id}>
        <span>{question.label}</span>
        {question.helperText ? <small id={helperId}>{question.helperText}</small> : null}
      </label>
      <textarea
        aria-describedby={`${question.helperText ? helperId : ''} ${statusId}`.trim()}
        aria-invalid={value.length > 0 && !validation.isValid}
        autoComplete="off"
        id={question.id}
        maxLength={4000}
        name={question.id}
        onChange={(event) => onAnswer(question.id, event.target.value)}
        required={question.required}
        rows={4}
        value={value}
      />
      <span
        className={validation.isBlankEquivalent ? 'text-response-status invalid' : 'text-response-status'}
        id={statusId}
      >
        {statusMessage}
      </span>
    </div>
  );
}

function NoticeReview({
  step,
  answers,
  assignedVariant,
  noticeOrder,
  onAnswer
}: {
  step: NoticeReviewStep;
  answers: SurveyAnswers;
  assignedVariant: NoticeVariant;
  noticeOrder: NoticePresentationOrder;
  onAnswer: (answerId: string, value: AnswerValue) => void;
}) {
  const reviewed = answers[step.id] === reviewAcknowledgedValue;

  return (
    <div className="notice-review-stack">
      <NoticePresentation noticeOrder={noticeOrder} variant={assignedVariant} surface={step.noticeSurface} />
      <button
        className={reviewed ? 'review-confirm selected' : 'review-confirm'}
        type="button"
        onClick={() => onAnswer(step.id, reviewAcknowledgedValue)}
        aria-pressed={reviewed}
      >
        <NoticeIdentityBadge
          slot={getNoticeSlot(step.noticeSurface, noticeOrder)}
          surface={step.noticeSurface}
          variant={assignedVariant}
        />
        <span>{reviewed ? `Notice ${getNoticeSlot(step.noticeSurface, noticeOrder)} reviewed` : step.acknowledgementLabel}</span>
      </button>
    </div>
  );
}

export function StepRenderer({ step, answers, assignedVariant, noticeOrder, onAnswer }: StepRendererProps) {
  switch (step.kind) {
    case 'intro':
      return (
        <dl className="summary-row-grid">
          {step.highlights.map((highlight) => (
            <div className="summary-row" key={highlight.label}>
              <dt>{highlight.label}</dt>
              <dd>{highlight.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'single': {
      return (
        <div className="choice-grid">
          {step.choices.map((choice) => {
            const preferenceSurfaces: NoticeSurface[] =
              step.id !== 'presentation_preference'
                ? []
                : choice.id === 'prefer_assigned_notice'
                  ? ['assigned']
                  : ['reference-text'];

            return (
              <ChoiceButton
                choice={choice}
                identity={
                  preferenceSurfaces.length > 0 ? (
                    <span className="choice-identities">
                      {preferenceSurfaces.map((surface) => (
                        <NoticeIdentityBadge
                          key={surface}
                          slot={getNoticeSlot(surface, noticeOrder)}
                          surface={surface}
                          variant={assignedVariant}
                        />
                      ))}
                    </span>
                  ) : undefined
                }
                key={choice.id}
                selected={isSelected(answers[step.id], choice)}
                onSelect={() => onAnswer(step.id, getChoiceAnswerValue(choice))}
              />
            );
          })}
        </div>
      );
    }
    case 'context': {
      const completion = getStepCompletion(step, answers);
      return (
        <div className="question-stack">
          <p className="within-step-status" aria-live="polite">
            {completion.completed} of {completion.total} questions answered
          </p>
          {step.questions.map((question) => (
            <ChoiceQuestionGroup key={question.id} question={question} answers={answers} onAnswer={onAnswer} />
          ))}
        </div>
      );
    }
    case 'instructions':
      return (
        <ol className="instruction-grid">
          {step.callouts.map((callout, index) => (
            <li className="instruction-item" key={callout.label}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <strong>{callout.label}</strong>
              <small>{callout.detail}</small>
            </li>
          ))}
        </ol>
      );
    case 'notice-review':
      return <NoticeReview step={step} answers={answers} assignedVariant={assignedVariant} noticeOrder={noticeOrder} onAnswer={onAnswer} />;
    case 'likert-group': {
      const completion = getStepCompletion(step, answers);
      return (
        <div className="likert-stack">
          <p className="within-step-status" aria-live="polite">
            {completion.completed} of {completion.total} ratings answered
          </p>
          {step.questions.map((question) => (
            <fieldset className="likert-row" key={question.id}>
              <legend>{question.label}</legend>
              <div className="likert-scale">
                <span className="scale-endpoint">{question.lowLabel}</span>
                <div className="scale-options">
                  {step.scale.map((choice) => (
                    <label className="scale-choice" key={choice.id}>
                      <input
                        checked={answers[question.id] === choice.value}
                        name={question.id}
                        onChange={() => onAnswer(question.id, choice.value)}
                        type="radio"
                        value={choice.value}
                      />
                      <span>{choice.shortLabel}</span>
                    </label>
                  ))}
                </div>
                <span className="scale-endpoint">{question.highLabel}</span>
              </div>
            </fieldset>
          ))}
        </div>
      );
    }
    case 'text-group':
      return (
        <div className="text-question-stack">
          {step.questions.map((question) => (
            <TextQuestionField
              answer={answers[question.id]}
              key={question.id}
              onAnswer={onAnswer}
              question={question}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}
