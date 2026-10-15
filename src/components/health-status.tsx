"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api/health";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Connection = { state: "loading" | "online" | "offline"; message: string };

export function HealthStatus() {
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<Connection>({
    state: "loading",
    message: "Connecting to the booking service…",
  });
  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((health) => {
        if (!controller.signal.aborted)
          setConnection(
            health.status === "UP" && health.database === "UP"
              ? {
                  state: "online",
                  message: "API connected · PostgreSQL connected",
                }
              : {
                  state: "offline",
                  message: "The booking service is starting. Please try again.",
                },
          );
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setConnection({
            state: "offline",
            message:
              error instanceof ApiError && error.status === 503
                ? "The API is online, but its database is unavailable."
                : "The booking service is unavailable. Check that lumorab is running and try again.",
          });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-5 border border-border/60 shadow-none">
      <div role="status" aria-live="polite">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Development connection
        </p>
        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${connection.state === "online" ? "bg-primary" : "bg-muted-foreground"}`}
          />
          {connection.message}
        </p>
      </div>
      <Button
        variant="outline"
        disabled={connection.state === "loading"}
        onClick={() => {
          setConnection({ state: "loading", message: "Reconnecting…" });
          setAttempt((value) => value + 1);
        }}
      >
        Check connection
      </Button>
    </Card>
  );
}
