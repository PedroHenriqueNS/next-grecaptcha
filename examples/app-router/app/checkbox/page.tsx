"use client";
import { useRef, useState } from "react";
import { ReCaptchaCheckbox, type ReCaptchaCheckboxHandle } from "next-grecaptcha/client";
import { ResultPanel } from "../components/ResultPanel";

// next-grecaptcha — checkbox → Route Handler
// 1. <ReCaptchaCheckbox> renders the widget and hands us a token via onToken
// 2. POST the token to /api/checkbox
// 3. that route verifies it server-side with the secret key
export default function CheckboxDemo() {
  const widgetRef = useRef<ReCaptchaCheckboxHandle>(null);
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");

  async function submit() {
    const res = await fetch("/api/checkbox", {
      method: "POST",
      headers: { "x-recaptcha-token": token },
    });
    setResult(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">v2 · checkbox</div>
        <h1 className="page-header__title">Checkbox widget</h1>
        <p className="page-header__desc">
          The user ticks the box, your client receives a token, and you <code>POST</code> it to{" "}
          <code>/api/checkbox</code> where it is verified with the secret key.
        </p>
      </header>

      <div className="stage">
        <div className="stage__label">Widget</div>
        <ReCaptchaCheckbox
          ref={widgetRef}
          theme="dark"
          onToken={setToken}
          onExpired={() => setToken("")}
        />
        <div className="actions">
          <button className="btn btn--primary" disabled={!token} onClick={submit}>
            Verify on server
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              widgetRef.current?.reset();
              setToken("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <ResultPanel result={result} />
    </>
  );
}
