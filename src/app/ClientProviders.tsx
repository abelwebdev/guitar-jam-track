'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

import { ThemeProvider } from "@/components/theme-provider";
import { Provider } from "react-redux";
import { store } from "@/store";
import { PlayerProvider } from "@/contexts/PlayerContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      capture_pageview: false,
      loaded: (posthog) => {
        console.log('PostHog loaded:', posthog);
      },
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
        <PlayerProvider>
          {children}
        </PlayerProvider>
      </Provider>
    </ThemeProvider>
  );
}