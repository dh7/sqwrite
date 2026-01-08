import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TrackingProvider } from "@/components/TrackingProvider";

export const metadata: Metadata = {
  title: "Square - Opinionated Presentation Editor",
  description: "An opinionated presentation editor and player. Use AI to create your deck, it's semantic—AI understands what you build and helps you craft it.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
          <TrackingProvider>{children}</TrackingProvider>
        </body>
    </html>
  );
}

