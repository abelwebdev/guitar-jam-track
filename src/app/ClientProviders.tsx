'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { Provider } from "react-redux";
import { store } from "@/store";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Provider store={store}>
        {children}
      </Provider>
    </ThemeProvider>
  );
}