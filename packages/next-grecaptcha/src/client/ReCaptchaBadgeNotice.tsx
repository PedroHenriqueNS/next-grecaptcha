import type { ReactElement } from "react";

export interface ReCaptchaBadgeNoticeProps {
  /**
   * Include Privacy Policy / Terms of Service links (Google's historical
   * recommended long form). The FAQ's minimal requirement is just the
   * sentence "This site is protected by reCAPTCHA." @default true
   */
  withLinks?: boolean;
  /** CSS class applied to the wrapping `<span>`. */
  className?: string;
}

/**
 * Google's required reCAPTCHA attribution for sites that hide the badge via
 * CSS (`.grecaptcha-badge { visibility: hidden; }`). Hiding the badge is only
 * allowed when this branding is visible in the user flow — see the README.
 * Unstyled; place and style it yourself.
 */
export function ReCaptchaBadgeNotice({ withLinks = true, className }: ReCaptchaBadgeNoticeProps): ReactElement {
  if (!withLinks) {
    return <span className={className}>This site is protected by reCAPTCHA.</span>;
  }
  return (
    <span className={className}>
      This site is protected by reCAPTCHA and the Google{" "}
      <a href="https://policies.google.com/privacy">Privacy Policy</a> and{" "}
      <a href="https://policies.google.com/terms">Terms of Service</a> apply.
    </span>
  );
}
