import { CheckCircle2 } from 'lucide-react';
import { reviewAcknowledgedValue, getChoiceAnswerValue } from '../surveyLogic';
import type {
  AnswerValue,
  Choice,
  ChoiceQuestion,
  NoticeReviewStep,
  NoticeVariant,
  StudyStep,
  SurveyAnswers
} from '../types';
import { NoticePresentation } from './NoticePresentation';

type StepRendererProps = {
  step: StudyStep;
  answers: SurveyAnswers;
  assignedVariant: NoticeVariant;
  onAnswer: (answerId: string, value: AnswerValue) => void;
};

function isSelected(answer: AnswerValue | undefined, choice: Choice): boolean {
  return answer === getChoiceAnswerValue(choice);
}

function ChoiceButton({
  choice,
  selected,
  onSelect
}: {
  choice: Choice;
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

function NoticeReview({
  step,
  answers,
  assignedVariant,
  onAnswer
}: {
  step: NoticeReviewStep;
  answers: SurveyAnswers;
  assignedVariant: NoticeVariant;
  onAnswer: (answerId: string, value: AnswerValue) => void;
}) {
  const reviewed = answers[step.id] === reviewAcknowledgedValue;

  return (
    <div className="notice-review-stack">
      <NoticePresentation variant={assignedVariant} surface={step.noticeSurface} />
      <button
        className={reviewed ? 'review-confirm selected' : 'review-confirm'}
        type="button"
        onClick={() => onAnswer(step.id, reviewAcknowledgedValue)}
        aria-pressed={reviewed}
      >
        <CheckCircle2 size={18} />
        {reviewed ? 'Notice reviewed' : step.acknowledgementLabel}
      </button>
    </div>
  );
}

export function StepRenderer({ step, answers, assignedVariant, onAnswer }: StepRendererProps) {
  switch (step.kind) {
    case 'intro':
      return (
        <div className="intro-grid">
          <div className="intro-copy">
            <div className="summary-row-grid">
              {step.highlights.map((highlight) => (
                <div className="summary-row" key={highlight.label}>
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <img className="intro-illustration" src={step.illustrationAsset} alt="" aria-hidden="true" />
        </div>
      );
    case 'single':
      return (
        <div className="choice-grid">
          {step.choices.map((choice) => (
            <ChoiceButton
              choice={choice}
              key={choice.id}
              selected={isSelected(answers[step.id], choice)}
              onSelect={() => onAnswer(step.id, getChoiceAnswerValue(choice))}
            />
          ))}
        </div>
      );
    case 'context':
      return (
        <div className="question-stack">
          {step.questions.map((question) => (
            <ChoiceQuestionGroup key={question.id} question={question} answers={answers} onAnswer={onAnswer} />
          ))}
        </div>
      );
    case 'instructions':
      return (
        <div className="instruction-grid">
          {step.callouts.map((callout) => (
            <div className="instruction-item" key={callout.label}>
              <strong>{callout.label}</strong>
              <span>{callout.detail}</span>
            </div>
          ))}
        </div>
      );
    case 'notice-review':
      return <NoticeReview step={step} answers={answers} assignedVariant={assignedVariant} onAnswer={onAnswer} />;
    case 'likert-group':
      return (
        <div className="likert-stack">
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
    case 'text-group':
      return (
        <div className="text-question-stack">
          {step.questions.map((question) => (
            <label className="text-question" key={question.id}>
              <span>{question.label}</span>
              {question.helperText ? <small>{question.helperText}</small> : null}
              <textarea
                onChange={(event) => onAnswer(question.id, event.target.value)}
                placeholder={question.placeholder}
                rows={4}
                value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
              />
            </label>
          ))}
        </div>
      );
    default:
      return null;
  }
}
