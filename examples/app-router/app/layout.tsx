import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ReCaptchaProvider, ReCaptchaBadgeNotice } from "next-grecaptcha/client";
import { TEST_V2_SITE_KEY } from "../lib/recaptcha-keys";
import { SiteNav } from "./components/SiteNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = { title: "next-grecaptcha demo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <ReCaptchaProvider
          siteKey={TEST_V2_SITE_KEY}
          v3SiteKey={process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY}
        >
          <SiteNav />
          <main className="main">{children}</main>
          <footer className="footer">
            <ReCaptchaBadgeNotice />
          </footer>
        </ReCaptchaProvider>
      </body>
    </html>
  );
}
