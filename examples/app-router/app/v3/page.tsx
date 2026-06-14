"use client";
import { useState } from "react";
import { useReCaptchaV3 } from "next-grecaptcha/client";
import { ResultPanel } from "../components/ResultPanel";

const V3_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;

// next-grecaptcha — v3 score-based → Route Handler
// 1. useReCaptchaV3() loads the v3 script and exposes executeRecaptcha
// 2. executeRecaptcha("demo_submit") returns a token bound to that action
// 3. POST the token to /api/v3, which verifies it and checks the score
export default function V3Demo() {
  const { executeRecaptcha, isReady } = useReCaptchaV3();
  const [result, setResult] = useState("");

  async function submit() {
    try {
      const token = await executeRecaptcha("demo_submit");
      const res = await fetch("/api/v3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResult(JSON.stringify(await res.json(), null, 2));
    } catch (error) {
      setResult(String(error));
    }
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">v3 · score</div>
        <h1 className="page-header__title">Score-based (v3)</h1>
        <p className="page-header__desc">
          Run an action, receive a score, and enforce a threshold on the server.
        </p>
      </header>

      {!V3_KEY ? (
        <div className="callout">
          Google publishes automated-testing keys for v2 only. To run this demo, create a v3 key
          pair in the reCAPTCHA admin console and set{" "}
          <code>NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY</code> and <code>RECAPTCHA_SECRET_KEY</code>.
        </div>
      ) : (
        <>
          <div className="stage">
            <div className="stage__label">Action</div>
            <div className="actions">
              <button className="btn btn--primary" disabled={!isReady} onClick={submit}>
                Execute &quot;demo_submit&quot; + verify
              </button>
            </div>
          </div>
          <ResultPanel result={result} />
        </>
      )}
    </>
  );
}
