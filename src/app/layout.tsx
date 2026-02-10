import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Guitar JamTrack - Professional Backing Tracks for Guitar Practice",
  description: "Search thousands of professional guitar backing tracks and practice smarter with our intelligent platform.",
  keywords: "guitar backing tracks, guitar practice, backing tracks, guitar learning, music practice, guitar jam tracks",
  authors: [{ name: "Guitar JamTrack" }],
  creator: "Guitar JamTrack",
  publisher: "Guitar JamTrack",
  robots: "index, follow",
  openGraph: {
    title: "Guitar JamTrack - Professional Backing Tracks",
    description: "Search thousands of professional guitar backing tracks and practice smarter.",
    url: "https://guitar-jam-track.netlify.app",
    siteName: "Guitar JamTrack",
    type: "website",
    images: [
      {
        url: "/guitar-jam-track.png",
        width: 1200,
        height: 630,
        alt: "Guitar JamTrack Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guitar JamTrack - Professional Backing Tracks",
    description: "Search thousands of professional guitar backing tracks and practice smarter.",
    images: ["/guitar-jam-track.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ],
  },
  manifest: "/site.webmanifest",
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Toaster
          position="top-center"
          theme="dark"
          richColors
        />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}