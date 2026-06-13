"use client";
import { useActionState, useState } from "react";
import { ReCaptchaCheckbox } from "next-grecaptcha/client";
import { submitWithRecaptcha, type ActionState } from "./actions";

export function CheckboxField() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(submitWithRecaptcha, null);
  const [token, setToken] = useState("");

  return (
    <form action={formAction}>
      <ReCaptchaCheckbox onToken={setToken} onExpired={() => setToken("")} />
      <input type="hidden" name="recaptchaToken" value={token} />
      <button type="submit" disabled={!token}>Submit via Server Action</button>
      {state && <p>{state.ok ? "OK: " : "Failed: "}{state.message}</p>}
    </form>
  );
}
