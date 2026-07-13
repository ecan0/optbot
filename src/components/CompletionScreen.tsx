import { CheckCircle2, Download, ShieldCheck } from 'lucide-react';
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
      <section className="completion-panel" aria-labelledby="complete-title">
        <div className="brand-row">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>
          <span>OptBot Study</span>
        </div>
        <span className="completion-mark" aria-hidden="true">
          <CheckCircle2 size={28} />
        </span>
        <h1 id="complete-title">{participationDeclined ? 'Participation was not confirmed.' : 'Thanks for reviewing the notices.'}</h1>
        <p>
          {participationDeclined
            ? 'No response was submitted because participation was declined.'
            : isPreview
              ? 'Preview complete. Nothing was stored.'
              : `Response reference: ${result?.responseId}`}
        </p>
        {isPreview ? (
          <button className="secondary-action" type="button" onClick={onDownload}>
            <Download size={18} />
            Download preview JSON
          </button>
        ) : null}
      </section>
    </main>
  );
}
