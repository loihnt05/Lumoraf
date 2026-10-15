import type { ReactNode } from "react";

// Layout only: add server-side Clerk and API authorization before exposing routes.
export function WorkspaceShell({
  children,
  area,
}: {
  children: ReactNode;
  area: "account" | "manager" | "admin";
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-6 py-5">
        <span className="font-semibold">Lumora</span>
        <span className="ml-3 text-sm capitalize text-muted-foreground">
          {area}
        </span>
      </header>
      <main className="page-container py-8">{children}</main>
    </div>
  );
}
