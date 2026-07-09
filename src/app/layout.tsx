import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoParts — Inventory Management",
  description:
    "Modern inventory & sales management for automotive spare parts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
