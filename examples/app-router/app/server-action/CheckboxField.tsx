"use client";
import { useActionState, useState } from "react";
import { ReCaptchaCheckbox } from "next-grecaptcha/client";
import { submitWithRecaptcha, type ActionState } from "./actions";

// next-grecaptcha — checkbox → Server Action
// 1. <ReCaptchaCheckbox> hands us a token via onToken
// 2. stash it in a hidden field so it posts with the form
// 3. the Server Action (submitWithRecaptcha) verifies it server-side
export function CheckboxField() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(submitWithRecaptcha, null);
  const [token, setToken] = useState("");

  return (
    <form action={formAction} className="form">
      <ReCaptchaCheckbox theme="dark" onToken={setToken} onExpired={() => setToken("")} />
      <input type="hidden" name="recaptchaToken" value={token} />
      <button type="submit" className="btn btn--primary" disabled={!token}>
        Submit via Server Action
      </button>
      {state && (
        <p className={`pill ${state.ok ? "pill--ok" : "pill--err"}`}>
          {state.ok ? "OK: " : "Failed: "}
          {state.message}
        </p>
      )}
    </form>
  );
}
