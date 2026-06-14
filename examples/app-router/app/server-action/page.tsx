import { CheckboxField } from "./CheckboxField";

export default function ServerActionDemo() {
  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">v2 · checkbox → server action</div>
        <h1 className="page-header__title">Checkbox via Server Action</h1>
        <p className="page-header__desc">
          The same checkbox token, submitted through a Next.js Server Action and verified there
          instead of in a Route Handler.
        </p>
      </header>
      <div className="stage">
        <CheckboxField />
      </div>
    </>
  );
}
