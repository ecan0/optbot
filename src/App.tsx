import { useEffect, useMemo, useState } from 'react';
import { submitResponse, type SubmitResult } from './api';
import { CompletionScreen } from './components/CompletionScreen';
import { StepRenderer } from './components/StepRenderer';
import { SurveyFrame } from './components/SurveyFrame';
import { consentVersion, studySteps } from './studyContent';
import {
  assignNoticeVariant,
  buildResponsePayload,
  getStepValidationMessage,
  isConsentDenied,
  isStepComplete
} from './surveyLogic';
import type { AnswerValue, SurveyAnswers } from './types';
import './styles.css';

const surveyId = import.meta.env.VITE_PUBLIC_SURVEY_ID || 'optbot-study-v1';

function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | undefined>();
  const assignedVariant = useMemo(() => assignNoticeVariant(sessionStorage, crypto), []);

  const step = studySteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / studySteps.length) * 100);
  const isLastStep = stepIndex === studySteps.length - 1;
  const participationDeclined = isConsentDenied(answers);

  useEffect(() => {
    if (stepIndex === 0) {
      return;
    }

    const focusTimer = window.setTimeout(() => document.getElementById('step-title')?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [stepIndex]);

  function setAnswer(answerId: string, value: AnswerValue) {
    setAnswers((existing) => ({ ...existing, [answerId]: value }));
    setError(null);
  }


  function createPayload(completedAt = new Date().toISOString()) {
    return buildResponsePayload({
      surveyId,
      consentVersion,
      answers,
      variant: assignedVariant,
      startedAt,
      completedAt,
      userAgent: navigator.userAgent
    });
  }

  async function handleNext() {
    const validationMessage = getStepValidationMessage(step, answers);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (participationDeclined) {
      setStatus('done');
      setSubmitResult(undefined);
      return;
    }

    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      setError(null);
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const result = await submitResponse(createPayload());
      setSubmitResult(result);
      setStatus('done');
    } catch (submitError) {
      setStatus('idle');
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit response.');
    }
  }

  function downloadPreview() {
    const blob = new Blob([JSON.stringify(createPayload(), null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optbot-preview-response.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (status === 'done') {
    return (
      <CompletionScreen
        onDownload={downloadPreview}
        participationDeclined={participationDeclined}
        result={submitResult}
      />
    );
  }

  return (
    <SurveyFrame
      canGoBack={stepIndex > 0}
      currentStep={stepIndex + 1}
      error={error}
      isLastStep={isLastStep}
      isSubmitting={status === 'submitting'}
      onBack={() => setStepIndex((index) => Math.max(index - 1, 0))}
      onNext={handleNext}
      progress={progress}
      stepId={step.id}
      stepKind={step.kind}
      titleId="step-title"
      totalSteps={studySteps.length}
    >
      <p className="step-label">{step.eyebrow}</p>
      <h1 id="step-title" tabIndex={-1}>{step.title}</h1>
      <p className="prompt">{step.prompt}</p>
      <div data-step-body key={step.id}>
        <StepRenderer
          answers={answers}
          assignedVariant={assignedVariant}
          onAnswer={setAnswer}
          step={step}
        />
        {!isStepComplete(step, answers) && step.required ? <p className="required-note">Required</p> : null}
      </div>
    </SurveyFrame>
  );
}

export default App;
