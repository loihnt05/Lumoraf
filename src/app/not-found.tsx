import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="page-container space-y-6 py-20">
      <p className="text-caption">404</p>
      <h1 className="text-heading">This space hasn’t opened yet.</h1>
      <Button asChild>
        <Link href="/booking">Back to booking</Link>
      </Button>
    </main>
  );
}
