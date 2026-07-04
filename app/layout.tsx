import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConflictProvider } from "@/contexts/ConflictContext";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orkaive — AI Workforce Infrastructure for Enterprises",
  description:
    "Orkaive is the operations layer for enterprise AI: orchestrate specialist agents, archive every decision, and route conflicts to a human in the loop.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} ${interTight.variable}`}
    >
      <body className="antialiased">
        <AuthProvider>
          <ConflictProvider>{children}</ConflictProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
