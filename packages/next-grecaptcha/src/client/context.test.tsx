// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetRecaptchaLoaderForTests } from "./loader";
import { ReCaptchaProvider, useReCaptchaConfig } from "./context";

function Probe() {
  const config = useReCaptchaConfig();
  return <div data-testid="probe">{JSON.stringify(config)}</div>;
}

beforeEach(() => {
  __resetRecaptchaLoaderForTests();
  delete (window as { grecaptcha?: unknown }).grecaptcha;
  document.head.replaceChildren();
});
afterEach(cleanup);

describe("ReCaptchaProvider", () => {
  it("exposes its config through context", () => {
    render(
      <ReCaptchaProvider siteKey="K2" v3SiteKey="K3" host="recaptcha.net" hl="pt-BR" nonce="n1" autoLoadV3={false}>
        <Probe />
      </ReCaptchaProvider>,
    );
    expect(JSON.parse(screen.getByTestId("probe").textContent ?? "{}")).toEqual({
      siteKey: "K2",
      v3SiteKey: "K3",
      host: "recaptcha.net",
      hl: "pt-BR",
      nonce: "n1",
    });
  });

  it("returns an empty config outside a provider", () => {
    render(<Probe />);
    expect(JSON.parse(screen.getByTestId("probe").textContent ?? "x")).toEqual({});
  });

  it("auto-loads the v3 script on mount when v3SiteKey is set", () => {
    render(
      <ReCaptchaProvider v3SiteKey="K3">
        <div />
      </ReCaptchaProvider>,
    );
    const scripts = Array.from(document.querySelectorAll("script"));
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toContain("render=K3");
  });

  it("does not load the v3 script when autoLoadV3 is false or no v3SiteKey", () => {
    render(
      <ReCaptchaProvider v3SiteKey="K3" autoLoadV3={false}>
        <div />
      </ReCaptchaProvider>,
    );
    render(
      <ReCaptchaProvider siteKey="K2">
        <div />
      </ReCaptchaProvider>,
    );
    expect(document.querySelectorAll("script")).toHaveLength(0);
  });
});
