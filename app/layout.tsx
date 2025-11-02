import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SqWrite - Square Presentation Creator",
  description: "Create beautiful square presentations with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

