"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container space-y-6 py-20">
      <h1 className="text-heading">Something interrupted your visit.</h1>
      <p className="text-muted-foreground">
        Please try loading this page again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
