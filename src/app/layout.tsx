import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import SchemeSaathiChatbot from "@/components/SchemeSaathiChatbot";
import SmartNudgeBar from "@/components/SmartNudgeBar";
import OfflineSchemeBanner from "@/components/OfflineSchemeBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yojana Setu — योजना सेतु | Government Schemes Made Simple",
  description: "AI-powered GovTech platform matching Indian citizens to welfare benefits, subsidies, and government schemes.",
  manifest: "/manifest.json",
  themeColor: "#EA580C",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yojana Setu",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col relative bg-white dark:bg-slate-950 transition-colors duration-300">

        {/* ── Scripts must live directly in the Server Component (body), NOT inside any 'use client' wrapper ── */}
        <div id="google_translate_element" className="hidden" />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">{`
          function googleTranslateElementInit() {
            new window.google.translate.TranslateElement(
              { pageLanguage: 'en', autoDisplay: false },
              'google_translate_element'
            );
          }
        `}</Script>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextAuthProvider>
            {/* Background Blur Fade Image */}
            <div className="fixed inset-0 z-[-1] transition-opacity duration-300 dark:opacity-30">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-30"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1577083552431-5e4fd078c9df?q=80&w=2000&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/80 backdrop-blur-[30px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white dark:via-slate-950/50 dark:to-slate-950" />
            </div>

            {children}

            {/* 🤖 CHAT-3 Context-Aware Floating Chatbot */}
            <SchemeSaathiChatbot />
            {/* 🔔 Smart Nudge Notifications */}
            <SmartNudgeBar />
            {/* 📶 Offline Scheme Cache Banner */}
            <OfflineSchemeBanner />
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

