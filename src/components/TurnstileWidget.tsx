import { useEffect, useRef, useState } from 'react';

type TurnstileWidgetId = string;

type TurnstileApi = {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: 'dark';
      size: 'flexible';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': (errorCode: string) => void;
    }
  ) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  resetSignal: number;
  siteKey: string;
};

const scriptId = 'cloudflare-turnstile-script';
const scriptSource = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileLoad: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (turnstileLoad) {
    return turnstileLoad;
  }

  turnstileLoad = new Promise<TurnstileApi>((resolve, reject) => {
    document.getElementById(scriptId)?.remove();
    const script = document.createElement('script');

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        script.remove();
        reject(new Error('Turnstile loaded without its browser API.'));
      }
    };
    const handleError = () => {
      script.remove();
      reject(new Error('Turnstile could not be loaded.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    script.id = scriptId;
    script.src = scriptSource;
    script.async = true;
    script.defer = true;
    document.head.append(script);
  }).catch((error: unknown) => {
    turnstileLoad = null;
    throw error;
  });

  return turnstileLoad;
}

export function TurnstileWidget({ onTokenChange, resetSignal, siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const previousResetSignal = useRef(resetSignal);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'expired' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    onTokenChange(null);

    void loadTurnstile()
      .then((api) => {
        api.ready(() => {
          if (!active || !container) {
            return;
          }
          widgetIdRef.current = api.render(container, {
            sitekey: siteKey,
            action: 'survey-submit',
            theme: 'dark',
            size: 'flexible',
            callback: (token) => {
              onTokenChange(token);
              setStatus('verified');
            },
            'expired-callback': () => {
              onTokenChange(null);
              setStatus('expired');
            },
            'error-callback': (errorCode) => {
              container.dataset.turnstileError = errorCode;
              onTokenChange(null);
              setStatus('error');
            }
          });
          setStatus('ready');
        });
      })
      .catch(() => {
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
      onTokenChange(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, renderAttempt, siteKey]);

  useEffect(() => {
    if (previousResetSignal.current === resetSignal) {
      return;
    }
    previousResetSignal.current = resetSignal;
    onTokenChange(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus('ready');
    }
  }, [onTokenChange, resetSignal]);

  const statusMessage = {
    loading: 'Loading verification…',
    ready: 'Complete the verification before submitting.',
    verified: 'Verification complete. You can submit your response.',
    expired: 'Verification expired. Complete it again before submitting.',
    error: 'Verification is unavailable. Retry before submitting.'
  }[status];

  return (
    <section className="turnstile-panel" aria-labelledby="turnstile-title">
      <h2 id="turnstile-title">Submission verification</h2>
      <p>Complete this privacy-preserving check before sending your response.</p>
      <div className="turnstile-widget" ref={containerRef} />
      <p className="turnstile-status" role="status">{statusMessage}</p>
      {status === 'error' ? (
        <button
          className="secondary-action turnstile-retry"
          onClick={() => {
            setStatus('loading');
            setRenderAttempt((attempt) => attempt + 1);
          }}
          type="button"
        >
          Retry verification
        </button>
      ) : null}
    </section>
  );
}
