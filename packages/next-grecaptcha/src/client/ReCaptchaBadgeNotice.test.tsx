// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReCaptchaBadgeNotice } from "./ReCaptchaBadgeNotice";

afterEach(cleanup);

describe("ReCaptchaBadgeNotice", () => {
  it("renders the Google-required branding text with policy links by default", () => {
    render(<ReCaptchaBadgeNotice />);
    const notice = screen.getByText(/protected by reCAPTCHA/);
    expect(notice.textContent).toContain("This site is protected by reCAPTCHA");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveProperty(
      "href",
      "https://policies.google.com/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveProperty(
      "href",
      "https://policies.google.com/terms",
    );
  });

  it("renders exactly the docs-required sentence when withLinks is false", () => {
    render(<ReCaptchaBadgeNotice withLinks={false} />);
    expect(screen.getByText("This site is protected by reCAPTCHA.")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
