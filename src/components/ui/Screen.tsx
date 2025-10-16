/**
 * Screen shell: Header/Body/Footer with safe-area padding and mobile layout.
 * Invariants: presentational only; no business logic.
 */

import type { PropsWithChildren, ReactElement, ReactNode } from "react";

interface SectionProps extends PropsWithChildren {
  className?: string;
}

function Header({ children, className }: SectionProps): ReactElement {
  return (
    <header
      className={
        "sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 " +
        "border-b border-gray-200" +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-xl px-4 py-3">{children}</div>
    </header>
  );
}

function Body({ children, className }: SectionProps): ReactElement {
  return (
    <main className={("mx-auto max-w-xl px-4 py-4 " + (className ?? "")).trim()}>{children}</main>
  );
}

function Footer({ children, className }: SectionProps): ReactElement {
  return (
    <footer
      className={
        "sticky bottom-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 " +
        "border-t border-gray-200 pb-[max(env(safe-area-inset-bottom),1rem)]" +
        (className ?? "")
      }
    >
      <div className="mx-auto max-w-xl px-4 pt-3">{children}</div>
    </footer>
  );
}

export const Screen = Object.assign(
  function Screen({
    children,
  }: PropsWithChildren<{ header?: ReactNode; footer?: ReactNode }>): ReactElement {
    return <div className="min-h-dvh bg-white text-gray-900">{children}</div>;
  },
  { Header, Body, Footer },
);

export default Screen;
