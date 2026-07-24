'use client';

import { useEffect } from 'react';

import { ThemeProvider } from "@/components/theme-provider";
import { Provider } from "react-redux";
import { store } from "@/store";

const runWhenIdle = (callback: () => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 1500);
  return () => window.clearTimeout(timeoutId);
};

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!token) return;

    return runWhenIdle(() => {
      import('posthog-js').then(({ default: posthog }) => {
        if (posthog.__loaded) return;

        posthog.init(token, {
          api_host: '/ingest',
          ui_host: 'https://us.posthog.com',
          capture_pageview: false,
        });
      });
    });
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Provider store={store}>
        {children}
      </Provider>
    </ThemeProvider>
  );
}
