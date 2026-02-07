import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "One Piece TCG Collector",
  description: "One Piece Trading Card Game Collector",
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
            <Header />
            {children}
            <Toaster />
          </AddToCollectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
