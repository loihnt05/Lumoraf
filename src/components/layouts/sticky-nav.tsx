"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Calendar, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Booking", href: "/booking" },
];

function subscribeScroll(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getScrollSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.scrollY > 12;
}

function getScrollServerSnapshot(): boolean {
  return false;
}

export function StickyNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, openSignInModal, logout, login } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Reactive scroll tracking without setState in useEffect
  const isScrolled = React.useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getScrollServerSnapshot,
  );

  const initials = React.useMemo(() => {
    if (!user?.name) return "LU";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/80 bg-background/95 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06)] backdrop-blur-md"
          : "border-b border-border/40 bg-background/80 backdrop-blur-xs",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="page-container flex h-20 items-center justify-between gap-6"
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/booking"
            aria-label="Lumora home"
            onClick={closeMobileMenu}
            className="group flex items-center gap-1.5 text-xl font-semibold tracking-[0.24em] text-foreground transition-opacity hover:opacity-85"
          >
            <span>LUMORA</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-125" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-sm font-medium tracking-wide transition-colors",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Account / Auth State */}
        <div className="hidden items-center gap-4 md:flex">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex items-center gap-2.5 rounded-full border border-border/70 bg-surface py-1 pr-3 pl-1.5 shadow-xs transition-all hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                    {user.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>My Bookings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openSignInModal}
              className="h-10 rounded-full border-border bg-surface px-5 text-sm font-medium hover:border-primary/40 hover:bg-muted"
            >
              Sign in
            </Button>
          )}

          {/* Dev-only quick auth toggle to test signed-in / signed-out effortlessly */}
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              title="Dev toggle: Switch Auth State"
              onClick={() => {
                if (isAuthenticated) {
                  logout();
                } else {
                  login("google");
                }
              }}
              className="rounded-full border border-border/50 bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isAuthenticated ? "Dev: Sign out" : "Dev: Sign in"}
            </button>
          )}
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/booking"
            onClick={closeMobileMenu}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            Booking
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="border-b border-border bg-background/98 px-6 py-6 shadow-xl backdrop-blur-md animate-in slide-in-from-top-3 duration-200 md:hidden">
          <div className="flex flex-col space-y-4">
            <div className="pb-3 border-b border-border/60">
              <p className="text-caption uppercase tracking-[0.2em] text-muted-foreground">Menu</p>
              <div className="mt-3 flex flex-col space-y-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-primary font-normal">Active</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-caption uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Account
              </p>
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-surface p-3 border border-border/80">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/my-bookings"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>My Bookings</span>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="w-full justify-center rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    openSignInModal();
                    closeMobileMenu();
                  }}
                  className="w-full justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
