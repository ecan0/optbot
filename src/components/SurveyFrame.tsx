import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { publicRuntimeConfig } from '../config';
import type { StudyStep } from '../types';

gsap.registerPlugin(useGSAP);

type SurveyFrameProps = {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  progress: number;
  stepId: string;
  stepKind: StudyStep['kind'];
  titleId: string;
  error: string | null;
  canGoBack: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
};

const stepKindLabels: Record<StudyStep['kind'], string> = {
  intro: 'Study overview',
  single: 'Consent',
  context: 'About you',
  instructions: 'Instructions',
  'notice-review': 'Privacy notice',
  'likert-group': 'Assessment',
  'text-group': 'Feedback'
};

export function SurveyFrame({
  children,
  currentStep,
  totalSteps,
  progress,
  stepId,
  stepKind,
  titleId,
  error,
  canGoBack,
  isLastStep,
  isSubmitting,
  onBack,
  onNext
}: SurveyFrameProps) {
  const stepRegionRef = useRef<HTMLElement>(null);
  const isPreview = publicRuntimeConfig.collectionMode === 'preview';
  const buildLabel =
    publicRuntimeConfig.buildSha === 'local'
      ? publicRuntimeConfig.releaseRef
      : `${publicRuntimeConfig.releaseRef} · ${publicRuntimeConfig.buildSha.slice(0, 7)}`;


  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { duration: 0.22, ease: 'power2.out' } })
          .from('.step-label, #step-title, .prompt', {
            opacity: 0,
            y: 10,
            stagger: 0.035
          })
          .from('[data-step-body]', { autoAlpha: 0, y: 8 }, '<0.04');
      });

      return () => media.revert();
    },
    { dependencies: [stepId], revertOnUpdate: true, scope: stepRegionRef }
  );

  return (
    <main className="page-shell">
      <a className="skip-link" href={`#${titleId}`} onClick={(event) => { event.preventDefault(); document.getElementById(titleId)?.focus(); }}>Skip to survey question</a>
      <header className="study-header">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            <ShieldCheck size={21} />
          </span>
          <span className="brand-copy">
            <strong>OptBot</strong>
            <small>Privacy notice study</small>
          </span>
        </div>
        {isPreview ? (
          <div className="preview-meta" role="status">
            <span>
              <i aria-hidden="true" />
              Preview · responses not stored
            </span>
            <code title={`Preview build ${buildLabel}`}>{buildLabel}</code>
          </div>
        ) : null}
      </header>

      <div className="study-layout">
        <section className="progress-panel" aria-label="Survey progress">
          <div className="progress-meta">
            <strong>
              Step {currentStep} of {totalSteps}
            </strong>
            <span>{stepKindLabels[stepKind]}</span>
          </div>
          <div
            aria-label={`${progress}% complete`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="progress-segments"
            role="progressbar"
          >
            {Array.from({ length: totalSteps }, (_, index) => (
              <span
                className={index < currentStep ? 'complete' : undefined}
                key={index}
              />
            ))}
          </div>
        </section>

        <section className="step-region" aria-labelledby={titleId} ref={stepRegionRef}>
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
              <ChevronLeft aria-hidden="true" size={22} />
            </button>
            <button className="primary-action" disabled={isSubmitting} onClick={onNext} type="button">
              {isSubmitting ? 'Submitting…' : isLastStep ? 'Submit' : 'Continue'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
