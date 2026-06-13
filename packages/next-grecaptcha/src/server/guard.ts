import { RecaptchaBrowserImportError } from "../shared/errors";

/**
 * Import-time guard for the `next-grecaptcha/server` entry. This entry handles
 * the reCAPTCHA SECRET KEY and must never reach a browser bundle.
 *
 * NOTE: The PRIMARY control is the `./server` subpath boundary and the bundler
 * split — secret-handling code never ships in client/root bundles. This `window`
 * check is a defense-in-depth backstop for the common mistake of importing
 * `next-grecaptcha/server` directly from a Client Component.
 */
export function assertServerEnvironment(): void {
  if (typeof window !== "undefined") {
    throw new RecaptchaBrowserImportError(
      '"next-grecaptcha/server" was imported in a browser environment. ' +
        "This entry point handles the reCAPTCHA secret key and must only run on the server " +
        '(Route Handlers, API routes, Server Actions, middleware). For components and hooks, import from "next-grecaptcha/client".',
    );
  }
}
