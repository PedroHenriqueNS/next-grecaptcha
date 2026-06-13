"use client";
import { useRef, useState } from "react";
import { ReCaptchaCheckbox, type ReCaptchaCheckboxHandle } from "next-grecaptcha/client";

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
    <main>
      <h1>v2 checkbox</h1>
      <ReCaptchaCheckbox ref={widgetRef} onToken={setToken} onExpired={() => setToken("")} />
      <button disabled={!token} onClick={submit}>Verify on server</button>
      <button onClick={() => { widgetRef.current?.reset(); setToken(""); }}>Reset</button>
      <pre>{result}</pre>
    </main>
  );
}
