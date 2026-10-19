import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { StickyNav } from "./sticky-nav";
import { SignInModal } from "@/components/auth/sign-in-modal";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:shadow-lg focus:outline-2 focus:outline-primary"
      >
        Skip to content
      </a>

      {/* Sonder-inspired Sticky Navigation */}
      <StickyNav />

      {/* Global Sign In Modal */}
      <SignInModal />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="page-container min-h-[calc(100svh-14rem)] py-10 md:py-16"
      >
        {children}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-border/60 bg-surface/50 py-10 text-xs text-muted-foreground transition-colors">
        <div className="page-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p className="font-medium text-foreground tracking-wide">
              LUMORA<span className="text-primary">.</span>
            </p>
            <p>Thoughtful homestays and slow living spaces.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span>Modern boutique hospitality</span>
            <span>·</span>
            <span>All rights reserved &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </AuthProvider>
  );
}
