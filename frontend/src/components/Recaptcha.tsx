// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useEffect, useRef, useState } from 'react';

interface GrecaptchaRenderParams {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
}

interface Grecaptcha {
  render: (container: HTMLElement, params: GrecaptchaRenderParams) => number;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __onRecaptchaScriptLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

let scriptLoadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) {
    return Promise.resolve();
  }
  scriptLoadPromise ??= new Promise((resolve) => {
    window.__onRecaptchaScriptLoad = resolve;
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=__onRecaptchaScriptLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

interface RecaptchaProps {
  onChange: (token: string | null) => void;
}

/** Google reCAPTCHA v2 checkbox widget, gating login/registration against bots (§ anti-abuse). */
export function Recaptcha({ onChange }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRendered = useRef(false);
  const onChangeRef = useRef(onChange);
  const [scriptLoadError, setScriptLoadError] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || widgetRendered.current) return;
        widgetRendered.current = true;
        window.grecaptcha!.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onChangeRef.current(token),
          'expired-callback': () => onChangeRef.current(null),
        });
      })
      .catch(() => setScriptLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!SITE_KEY || scriptLoadError) {
    return <p className="text-xs text-red-600">reCAPTCHA failed to load. Check your connection and reload.</p>;
  }
  return <div ref={containerRef} />;
}
