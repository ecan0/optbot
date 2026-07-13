import { ChevronLeft, ChevronRight, Send, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { publicRuntimeConfig } from '../config';

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
  const isPreview = publicRuntimeConfig.collectionMode === 'preview';
  const buildLabel =
    publicRuntimeConfig.buildSha === 'local'
      ? publicRuntimeConfig.releaseRef
      : `${publicRuntimeConfig.releaseRef} · ${publicRuntimeConfig.buildSha.slice(0, 7)}`;

  return (
    <main className="page-shell">
      <header className="study-header">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            <ShieldCheck size={21} />
          </span>
          <span className="brand-copy">
            <strong>OptBot</strong>
            <small>Usable security study</small>
          </span>
        </div>
        {isPreview ? (
          <div className="preview-cluster">
            <div className="preview-banner" role="status">
              <span className="preview-beacon" aria-hidden="true" />
              <span>
                <strong>Design preview</strong>
                <small>Responses are not stored</small>
              </span>
            </div>
            <code className="build-identity" title={`Preview build ${buildLabel}`}>
              {buildLabel}
            </code>
          </div>
        ) : null}
      </header>

      <div className="study-layout">
        <section className="progress-panel" aria-label="Survey progress">
          <div className="progress-meta">
            <span className="step-count">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="progress-value">{progress}% complete</span>
          </div>
          <div
            aria-label={`${progress}% complete`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="progress-track"
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>Review the notices, compare formats, and share your assessment.</p>
        </section>

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
