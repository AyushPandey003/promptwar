import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpiceRoute Planner",
  description: "AI cooking to-do lists with meal plans, groceries, substitutions, and budget feasibility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}