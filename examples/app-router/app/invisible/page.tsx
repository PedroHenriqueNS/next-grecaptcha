"use client";
import { useRef, useState } from "react";
import { ReCaptchaInvisible, type ReCaptchaInvisibleHandle } from "next-grecaptcha/client";
import { ResultPanel } from "../components/ResultPanel";

// next-grecaptcha — invisible → Route Handler
// 1. <ReCaptchaInvisible> mounts a hidden widget
// 2. execute() returns a token on demand (no checkbox UI)
// 3. POST the token to /api/invisible to verify it server-side
export default function InvisibleDemo() {
  const widgetRef = useRef<ReCaptchaInvisibleHandle>(null);
  const [result, setResult] = useState("");

  async function submit() {
    try {
      const token = await widgetRef.current!.execute();
      const res = await fetch("/api/invisible", {
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
        <div className="page-header__eyebrow">v2 · invisible</div>
        <h1 className="page-header__title">Invisible widget</h1>
        <p className="page-header__desc">
          No checkbox — calling <code>execute()</code> yields a token, which you <code>POST</code>{" "}
          to <code>/api/invisible</code> for server-side verification.
        </p>
      </header>

      <div className="stage">
        <div className="stage__label">Widget</div>
        <ReCaptchaInvisible ref={widgetRef} badge="bottomleft" />
        <div className="actions">
          <button className="btn btn--primary" onClick={submit}>
            Execute + verify on server
          </button>
        </div>
      </div>

      <ResultPanel result={result} />
    </>
  );
}
