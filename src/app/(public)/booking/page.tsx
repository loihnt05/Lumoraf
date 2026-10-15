import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HealthStatus } from "@/components/health-status";

export const metadata: Metadata = { title: "Find your pause" };

export default function BookingPage() {
  return (
    <div className="space-y-12 md:space-y-20">
      <section
        className="grid items-end gap-10 md:grid-cols-[1.5fr_1fr] md:gap-20"
        aria-labelledby="booking-title"
      >
        <div>
          <Badge className="mb-8">Thoughtful stays. Coming soon.</Badge>
          <h1 id="booking-title" className="text-display max-w-3xl">
            Find your
            <br />
            <em className="font-normal text-primary">little pause.</em>
          </h1>
        </div>
        <div className="pb-2">
          <p className="text-body max-w-sm text-muted-foreground">
            A few quiet hours. A night away. A place that feels like yours.
          </p>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            We’re preparing our collection of homestays. Room selection and
            reservations will be available here soon.
          </p>
        </div>
      </section>
      <section
        aria-labelledby="coming-title"
        className="rounded-xl bg-primary px-7 py-10 text-primary-foreground md:px-12 md:py-14"
      >
        <p className="text-caption mb-5 uppercase tracking-[0.18em]">
          Space for your kind of stay
        </p>
        <h2 id="coming-title" className="text-heading max-w-xl">
          Less rush.
          <br />
          More room to just be.
        </h2>
        <p className="mt-6 max-w-lg text-sm leading-7 opacity-85">
          Discover a room, choose your time, and settle in. We’re starting with
          the essentials to make every stay feel effortless.
        </p>
      </section>
      <section aria-label="Booking availability">
        <Card className="border border-border/60 bg-transparent shadow-none">
          <h2 className="text-lg font-medium">Our doors will open soon</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            There are no rooms to book yet. Check back as we prepare our first
            spaces.
          </p>
        </Card>
      </section>
      {process.env.NODE_ENV === "development" && <HealthStatus />}
    </div>
  );
}
