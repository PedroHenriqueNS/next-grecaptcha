import type { ReactNode } from "react";
import { ReCaptchaProvider } from "next-grecaptcha/client";
import { TEST_V2_SITE_KEY } from "../lib/recaptcha-keys";

export const metadata = { title: "next-grecaptcha demo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReCaptchaProvider
          siteKey={TEST_V2_SITE_KEY}
          v3SiteKey={process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY}
        >
          {children}
        </ReCaptchaProvider>
      </body>
    </html>
  );
}
