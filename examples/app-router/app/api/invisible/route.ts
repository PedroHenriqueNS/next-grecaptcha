import { withRecaptcha } from "next-grecaptcha/server";
import { TEST_V2_SECRET_KEY } from "../../../lib/recaptcha-keys";

export const POST = withRecaptcha(
  async (_req, { recaptcha }) => Response.json({ ok: true, recaptcha }),
  {
    secretKey: process.env.RECAPTCHA_SECRET_KEY ?? TEST_V2_SECRET_KEY,
    tokenFrom: { jsonField: "token" },
  },
);
