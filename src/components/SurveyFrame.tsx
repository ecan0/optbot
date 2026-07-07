import { ChevronLeft, ChevronRight, Send, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type SurveyFrameProps = {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  progress: number;
  titleId: string;
  error: string | null;
  canGoBack: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function SurveyFrame({
  children,
  currentStep,
  totalSteps,
  progress,
  titleId,
  error,
  canGoBack,
  isLastStep,
  isSubmitting,
  onBack,
  onNext
}: SurveyFrameProps) {
  return (
    <main className="page-shell">
      <header className="study-header">
        <div className="brand-row">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>
          <span>OptBot Study</span>
        </div>
        <div className="preview-banner" role="status">
          Public preview. Study flow is visible for testing; production collection requires a configured API endpoint.
        </div>
      </header>

      <div className="study-layout">
        <aside className="progress-panel" aria-label="Survey progress">
          <span className="step-count">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>Review the notice, compare formats, and answer the follow-up ratings.</p>
        </aside>

        <section className="step-region" aria-labelledby={titleId}>
          {children}

          {error ? (
            <p className="error-text" role="alert">
              {error}
            </p>
          ) : null}

          <div className="actions-row">
            <button
              aria-label="Go back"
              className="icon-action"
              disabled={!canGoBack || isSubmitting}
              onClick={onBack}
              title="Go back"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <button className="primary-action" disabled={isSubmitting} onClick={onNext} type="button">
              {isLastStep ? <Send size={18} /> : <ChevronRight size={18} />}
              {isSubmitting ? 'Submitting' : isLastStep ? 'Submit' : 'Continue'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
