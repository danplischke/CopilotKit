import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProviderClient } from "../components/ThemeProviderClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CopilotKit ag_ui Integration Example",
  description: "A comprehensive example of using CopilotKit with ag_ui servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProviderClient>{children}</ThemeProviderClient>
      </body>
    </html>
  );
}

