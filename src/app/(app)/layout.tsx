"use client";

import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "포트폴리오" },
  { href: "/accounts", label: "계좌 관리" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            {links.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${isActive ? "font-semibold text-foreground underline underline-offset-4 decoration-2 decoration-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
