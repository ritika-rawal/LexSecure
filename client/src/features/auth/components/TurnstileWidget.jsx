import { useEffect, useRef, useState } from 'react';

import { env } from '../../../config/env.js';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise;

const loadTurnstileScript = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
    const script = existingScript || document.createElement('script');

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      reject(new Error('Turnstile did not initialize.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('Turnstile could not be loaded.')),
      { once: true },
    );

    if (!existingScript) {
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = undefined;
    document.getElementById(TURNSTILE_SCRIPT_ID)?.remove();
    throw error;
  });

  return scriptPromise;
};

const TurnstileWidget = ({ onError, onToken, resetKey }) => {
  const containerRef = useRef(null);
  const onErrorRef = useRef(onError);
  const onTokenRef = useRef(onToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onErrorRef.current = onError;
    onTokenRef.current = onToken;
  }, [onError, onToken]);

  useEffect(() => {
    let active = true;
    let widgetId;

    setIsLoading(true);
    onTokenRef.current('');

    loadTurnstileScript()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;

        widgetId = turnstile.render(containerRef.current, {
          sitekey: env.turnstileSiteKey,
          action: 'login',
          appearance: 'always',
          language: 'auto',
          size: 'flexible',
          theme: 'light',
          callback(token) {
            if (!active) return;
            setIsLoading(false);
            onErrorRef.current('');
            onTokenRef.current(token);
          },
          'expired-callback'() {
            if (!active) return;
            onTokenRef.current('');
            onErrorRef.current('Security verification expired. Complete it again.');
          },
          'error-callback'() {
            if (!active) return;
            setIsLoading(false);
            onTokenRef.current('');
            onErrorRef.current('Security verification could not be completed.');
          },
        });
      })
      .catch(() => {
        if (!active) return;
        setIsLoading(false);
        onErrorRef.current('Security verification could not be loaded.');
      });

    return () => {
      active = false;

      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [resetKey]);

  return (
    <div aria-busy={isLoading} aria-live="polite">
      <div ref={containerRef} />
      {isLoading ? (
        <p className="mt-2 text-sm text-gray-600">Loading security verification...</p>
      ) : null}
    </div>
  );
};

export default TurnstileWidget;
