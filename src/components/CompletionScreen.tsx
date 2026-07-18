import { Check, Download, ShieldCheck } from 'lucide-react';
import type { SubmitResult } from '../api';

type CompletionScreenProps = {
  result?: SubmitResult;
  participationDeclined: boolean;
  onDownload: () => void;
};

export function CompletionScreen({ result, participationDeclined, onDownload }: CompletionScreenProps) {
  const isPreview = result?.mode === 'preview';

  return (
    <main className="page-shell completion-shell">
      <a className="skip-link" href="#complete-title" onClick={(event) => { event.preventDefault(); document.getElementById('complete-title')?.focus(); }}>Skip to completion status</a>
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
      </header>
      <section className="completion-panel" aria-labelledby="complete-title">
        <span className="completion-mark" aria-hidden="true">
          <Check size={22} />
        </span>
        <h1 id="complete-title" ref={(heading) => heading?.focus()} tabIndex={-1}>{participationDeclined ? 'Participation was not confirmed.' : 'Thanks for reviewing the notices.'}</h1>
        <p>
          {participationDeclined
            ? 'No response was submitted because participation was declined.'
            : isPreview
              ? 'Preview complete. Nothing was stored.'
              : `Response reference: ${result?.responseId}`}
        </p>
        {isPreview ? (
          <button className="secondary-action" type="button" onClick={onDownload}>
            <Download aria-hidden="true" size={18} />
            Download preview JSON
          </button>
        ) : null}
      </section>
    </main>
  );
}
