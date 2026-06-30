import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Send, ShieldCheck } from 'lucide-react';
import { submitResponse } from './api';
import { consentVersion, studySteps } from './studyContent';
import type { AnswerValue, StudyStep, SurveyAnswers } from './types';
import './styles.css';

const surveyId = import.meta.env.VITE_PUBLIC_SURVEY_ID || 'optbot-study-v1';

function pickVariant() {
  const existing = sessionStorage.getItem('optbot_variant');
  if (existing) {
    return existing;
  }
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 2 === 0 ? 'guided-a' : 'guided-b';
  sessionStorage.setItem('optbot_variant', value);
  return value;
}

function currentAnswer(step: StudyStep, answers: SurveyAnswers) {
  return answers[step.id];
}

function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | undefined>();
  const variantId = useMemo(() => pickVariant(), []);

  const step = studySteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / studySteps.length) * 100);
  const answer = currentAnswer(step, answers);
  const canContinue = !step.required || (answer !== undefined && answer !== '');
  const isLastStep = stepIndex === studySteps.length - 1;
  const consentDenied = step.id === 'intro_consent' && answer === 'consent_no';

  function setAnswer(value: AnswerValue) {
    setAnswers((existing) => ({ ...existing, [step.id]: value }));
    setError(null);
  }

  async function handleNext() {
    if (!canContinue) {
      setError('Please choose an answer before continuing.');
      return;
    }

    if (consentDenied) {
      setStatus('done');
      setResponseId(undefined);
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
      const result = await submitResponse({
        survey_id: surveyId,
        variant_id: variantId,
        consent_version: consentVersion,
        answers,
        metadata: {
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });
      setResponseId(result.responseId);
      setStatus('done');
    } catch (submitError) {
      setStatus('idle');
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit response.');
    }
  }

  function downloadPreview() {
    const blob = new Blob([JSON.stringify({ surveyId, variantId, consentVersion, answers }, null, 2)], {
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
      <main className="page-shell">
        <section className="survey-panel complete-panel" aria-labelledby="complete-title">
          <div className="brand-row">
            <span className="brand-mark"><CheckCircle2 size={22} /></span>
            <span>OptBot Study</span>
          </div>
          <h1 id="complete-title">Thanks for taking a look.</h1>
          <p>
            {responseId
              ? `Response reference: ${responseId}`
              : 'No response was submitted because participation was not confirmed.'}
          </p>
          <button className="secondary-action" type="button" onClick={downloadPreview}>
            <Download size={18} />
            Download preview JSON
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="survey-panel" aria-labelledby="step-title">
        <div className="topline">
          <div className="brand-row">
            <span className="brand-mark"><ShieldCheck size={22} /></span>
            <span>OptBot Study</span>
          </div>
          <span className="step-count">{stepIndex + 1} of {studySteps.length}</span>
        </div>

        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="eyebrow">{step.eyebrow}</p>
        <h1 id="step-title">{step.title}</h1>
        <p className="prompt">{step.prompt}</p>

        {step.kind === 'text' ? (
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={step.placeholder}
            rows={5}
          />
        ) : (
          <div className={step.kind === 'likert' ? 'choice-grid likert-grid' : 'choice-grid'}>
            {step.choices?.map((choice) => {
              const value = choice.value ?? choice.id;
              const selected = answer === value;
              return (
                <button
                  key={choice.id}
                  className={selected ? 'choice selected' : 'choice'}
                  type="button"
                  onClick={() => setAnswer(value)}
                  aria-pressed={selected}
                >
                  <span>{choice.label}</span>
                  {choice.detail ? <small>{choice.detail}</small> : null}
                </button>
              );
            })}
          </div>
        )}

        {error ? <p className="error-text" role="alert">{error}</p> : null}

        <div className="actions-row">
          <button
            className="icon-action"
            type="button"
            onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
            disabled={stepIndex === 0 || status === 'submitting'}
            aria-label="Go back"
            title="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <button className="primary-action" type="button" onClick={handleNext} disabled={status === 'submitting'}>
            {isLastStep ? <Send size={18} /> : <ChevronRight size={18} />}
            {isLastStep ? 'Submit' : 'Continue'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
