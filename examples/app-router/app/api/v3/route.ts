import { verifyRecaptcha } from "next-grecaptcha/server";
import { TEST_V2_SECRET_KEY } from "../../../lib/recaptcha-keys";

export async function POST(req: Request): Promise<Response> {
  const { token } = (await req.json()) as { token?: string };
  // Returns the raw discriminated union so the demo shows score/action;
  // use assertRecaptcha/withRecaptcha with expectedAction+minScore in real apps.
  const result = await verifyRecaptcha(token ?? "", {
    secretKey: process.env.RECAPTCHA_SECRET_KEY ?? TEST_V2_SECRET_KEY,
  });
  return Response.json(result, { status: result.success ? 200 : 403 });
}
