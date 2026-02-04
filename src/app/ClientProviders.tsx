'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { Provider } from "react-redux";
import { store } from "@/store";
import { PlayerProvider } from "@/contexts/PlayerContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
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