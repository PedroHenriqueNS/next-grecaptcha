import { withRecaptcha } from "next-grecaptcha/server";
import { TEST_V2_SECRET_KEY } from "../../../lib/recaptcha-keys";

export async function POST(
  req: Request,
  ctx: { params: Promise<Record<string, string | string[]>> },
): Promise<Response> {
  return withRecaptcha<typeof ctx>(
    async (_req, { recaptcha }) => Response.json({ ok: true, recaptcha }),
    {
      secretKey: process.env.RECAPTCHA_SECRET_KEY ?? TEST_V2_SECRET_KEY,
      tokenFrom: { jsonField: "token" },
    },
  )(req, ctx);
}
