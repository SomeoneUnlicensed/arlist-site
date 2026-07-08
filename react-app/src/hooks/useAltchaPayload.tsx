import React, { useEffect, useRef, useState } from 'react';

type AltchaWidgetElement = HTMLElement & {
  verify: () => Promise<{ payload: string } | null>;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<AltchaWidgetElement>,
        AltchaWidgetElement
      > & {
        auto?: string;
        challenge?: string;
        display?: string;
        hidefooter?: boolean;
        hidelogo?: boolean;
        name?: string;
      };
    }
  }
}

export function useAltchaPayload() {
  const widgetRef = useRef<AltchaWidgetElement>(null);
  const [payload, setPayload] = useState<string | null>(null);

  useEffect(() => {
    void import('altcha');
  }, []);

  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ payload: string | null; state: string }>).detail;
      setPayload(detail.state === 'verified' ? detail.payload : null);
    };

    el.addEventListener('statechange', handler);
    return () => el.removeEventListener('statechange', handler);
  }, []);

  const getPayload = async () => {
    if (payload) return payload;
    const result = await widgetRef.current?.verify();
    return result?.payload ?? null;
  };

  return { getPayload, widgetRef };
}

export function InvisibleAltcha({
  widgetRef,
}: {
  widgetRef: React.RefObject<AltchaWidgetElement>;
}) {
  return (
    <altcha-widget
      ref={widgetRef}
      challenge="/api/captcha"
      auto="onload"
      display="invisible"
      hidefooter
      hidelogo
      name="altcha"
      style={{ display: 'none' }}
    />
  );
}
