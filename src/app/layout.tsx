import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Guitar JamTrack",
  description: "Search thousands of guitar backing tracks and practice smarter.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
        <body>
          <Toaster
            position="top-center"
            richColors
          />
          <ClientProviders>
            {children}
          </ClientProviders>
        </body>
      </html>
  );
}