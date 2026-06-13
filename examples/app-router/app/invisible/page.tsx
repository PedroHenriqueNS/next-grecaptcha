"use client";
import { useRef, useState } from "react";
import { ReCaptchaInvisible, type ReCaptchaInvisibleHandle } from "next-grecaptcha/client";

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
    <main>
      <h1>v2 invisible</h1>
      <ReCaptchaInvisible ref={widgetRef} badge="bottomleft" />
      <button onClick={submit}>Execute + verify on server</button>
      <pre>{result}</pre>
    </main>
  );
}
