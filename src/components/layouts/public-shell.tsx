import Link from "next/link";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-4"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-lg">
        <nav
          aria-label="Main navigation"
          className="page-container flex h-20 items-center justify-between gap-6"
        >
          <Link
            href="/booking"
            aria-label="Lumora home"
            className="text-xl font-semibold tracking-[0.22em]"
          >
            LUMORA<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-6 sm:gap-10">
            <Link
              href="/booking"
              aria-current="page"
              className="border-b border-primary py-2 text-sm font-medium"
            >
              Booking
            </Link>
            <span
              className="text-xs text-muted-foreground"
              title="Account access will arrive with identity and authorization."
            >
              Account · soon
            </span>
          </div>
        </nav>
      </header>
      <main
        id="main-content"
        className="page-container min-h-[calc(100svh-10rem)] py-12 md:py-20"
      >
        {children}
      </main>
      <footer className="page-container flex flex-wrap justify-between gap-3 border-t border-border py-7 text-xs text-muted-foreground">
        <span>Lumora · A little space to slow down.</span>
        <span>Thoughtful stays, taking shape.</span>
      </footer>
    </>
  );
}
