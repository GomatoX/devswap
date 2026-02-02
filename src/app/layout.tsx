import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { GoogleAnalytics } from "@/components/google-analytics";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DevSwap - B2B IT Resource Sharing Platform",
    template: "%s | DevSwap",
  },
  description:
    "Connect with IT companies to share developer resources. List your available talent or find skilled professionals for your projects. The B2B marketplace for IT staff augmentation.",
  keywords: [
    "IT outsourcing",
    "developer marketplace",
    "bench resources",
    "B2B talent",
    "IT staff augmentation",
    "software developer sharing",
    "contractor marketplace",
    "IT resource sharing",
    "developer bench",
    "tech talent platform",
  ],
  authors: [{ name: "DevSwap" }],
  creator: "DevSwap",
  publisher: "DevSwap",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://devswap.io",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "DevSwap",
    title: "DevSwap - B2B IT Resource Sharing Platform",
    description:
      "Connect with IT companies to share developer resources. List your available talent or find skilled professionals for your projects.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DevSwap - B2B IT Resource Sharing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevSwap - B2B IT Resource Sharing Platform",
    description:
      "Connect with IT companies to share developer resources. The B2B marketplace for IT staff augmentation.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <NextTopLoader showSpinner={false} />
          {children}
          <Toaster />
          <CookieConsent />
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
