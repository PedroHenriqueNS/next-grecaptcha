import Link from "next/link";
import { ReCaptchaBadgeNotice } from "next-grecaptcha/client";

export default function Home() {
  return (
    <main>
      <h1>next-grecaptcha demo</h1>
      <ul>
        <li><Link href="/checkbox">v2 checkbox → Route Handler</Link></li>
        <li><Link href="/invisible">v2 invisible → Route Handler</Link></li>
        <li><Link href="/v3">v3 score-based → Route Handler</Link></li>
        <li><Link href="/server-action">v2 checkbox → Server Action</Link></li>
      </ul>
      <footer>
        <ReCaptchaBadgeNotice />
      </footer>
    </main>
  );
}
