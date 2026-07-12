import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jisseki.io"),
  title: {
    default: "JISSEKI — Verified AI solutions",
    template: "%s | JISSEKI",
  },
  description:
    "Find AI solutions through company-approved outcomes, then contact the people who delivered them.",
  applicationName: "JISSEKI",
  openGraph: {
    type: "website",
    siteName: "JISSEKI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
