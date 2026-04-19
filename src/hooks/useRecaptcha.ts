import { useEffect, useCallback, useRef } from 'react';

const RECAPTCHA_SCRIPT_ID = 'recaptcha-v3-script';

export const useRecaptcha = (siteKey: string) => {
    const readyRef = useRef(false);

    useEffect(() => {
        if (!siteKey) return;
        if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
            readyRef.current = true;
            return;
        }

        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            readyRef.current = true;
        };
        document.head.appendChild(script);

        return () => {
            // Don't remove on unmount — other components may share it
        };
    }, [siteKey]);

    const executeRecaptcha = useCallback(
        async (action: string): Promise<string | null> => {
            if (!siteKey) return null;
            try {
                // Wait for grecaptcha to be available
                const g = (window as any).grecaptcha;
                if (!g) return null;
                return await new Promise<string>((resolve) => {
                    g.ready(() => {
                        g.execute(siteKey, { action }).then(resolve);
                    });
                });
            } catch (err) {
                console.error('reCAPTCHA execution failed:', err);
                return null;
            }
        },
        [siteKey]
    );

    return { executeRecaptcha, ready: readyRef };
};
