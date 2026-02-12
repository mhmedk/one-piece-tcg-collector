import type { Metadata } from "next";
import { Suspense } from "react";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AddToCollectionProvider } from "@/components/AddToCollectionProvider";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.myopbinder.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "My OP Binder",
    template: "%s | My OP Binder",
  },
  description: "Track and manage your One Piece TCG card collection",
  openGraph: {
    type: "website",
    siteName: "My OP Binder",
    title: "My OP Binder",
    description: "Track and manage your One Piece TCG card collection",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "My OP Binder",
    description: "Track and manage your One Piece TCG card collection",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sourceSans3.className} ${oswald.variable} min-h-screen antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AddToCollectionProvider>
            <Suspense>
              <Header />
            </Suspense>
            {children}
            <Toaster />
          </AddToCollectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
