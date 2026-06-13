"use client";
import { useState } from "react";
import { useReCaptchaV3 } from "next-grecaptcha/client";

const V3_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;

export default function V3Demo() {
  const { executeRecaptcha, isReady } = useReCaptchaV3();
  const [result, setResult] = useState("");

  if (!V3_KEY) {
    return (
      <main>
        <h1>v3 score-based</h1>
        <p>
          Google publishes automated-testing keys for v2 only. To run this demo, create a v3
          key pair in the reCAPTCHA admin console and set
          <code> NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY</code> and <code>RECAPTCHA_SECRET_KEY</code>.
        </p>
      </main>
    );
  }

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
    <main>
      <h1>v3 score-based</h1>
      <button disabled={!isReady} onClick={submit}>Execute action "demo_submit" + verify</button>
      <pre>{result}</pre>
    </main>
  );
}
