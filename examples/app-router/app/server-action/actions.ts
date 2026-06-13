"use server";
import { RecaptchaError } from "next-grecaptcha";
import { verifyRecaptchaAction } from "next-grecaptcha/server";
import { TEST_V2_SECRET_KEY } from "../../lib/recaptcha-keys";

export interface ActionState {
  ok: boolean;
  message: string;
}

export async function submitWithRecaptcha(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    const result = await verifyRecaptchaAction(formData, {
      secretKey: process.env.RECAPTCHA_SECRET_KEY ?? TEST_V2_SECRET_KEY,
    });
    return { ok: true, message: `verified for hostname "${result.hostname}"` };
  } catch (error) {
    if (error instanceof RecaptchaError) return { ok: false, message: error.message };
    throw error;
  }
}
