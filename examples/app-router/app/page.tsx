import Link from "next/link";

const DEMOS = [
  {
    href: "/checkbox",
    badge: "v2 · checkbox",
    title: "Checkbox → Route Handler",
    desc: "User ticks the box; POST the token to a Route Handler that verifies it server-side.",
  },
  {
    href: "/invisible",
    badge: "v2 · invisible",
    title: "Invisible → Route Handler",
    desc: "No checkbox UI — execute() yields a token on submit, verified by a Route Handler.",
  },
  {
    href: "/v3",
    badge: "v3 · score",
    title: "v3 score-based → Route Handler",
    desc: "Run an action, get a score, verify it server-side and enforce a threshold.",
  },
  {
    href: "/server-action",
    badge: "v2 · checkbox",
    title: "Checkbox → Server Action",
    desc: "Same checkbox token, verified inside a Next.js Server Action instead of a route.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="hero__title">next-grecaptcha</h1>
        <p className="hero__subtitle">
          Google reCAPTCHA v2 &amp; v3 for the Next.js App Router — verified on the server.
        </p>
        <div className="hero__tags">
          <span className="tag">v2 checkbox</span>
          <span className="tag">v2 invisible</span>
          <span className="tag">v3 score</span>
          <span className="tag">server-verified</span>
        </div>
      </section>

      <div className="grid">
        {DEMOS.map((d) => (
          <Link key={d.href} href={d.href} className="card">
            <span className="card__badge">{d.badge}</span>
            <h2 className="card__title">{d.title}</h2>
            <p className="card__desc">{d.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
