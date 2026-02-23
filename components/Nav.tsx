"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthStatus, useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

/**
 * Navigation component displaying links to different pages.
 *
 * @returns {JSX.Element} The rendered Nav component.
 */
export function Nav() {
  const t = useTranslations("Nav");
  const { status, userData, refreshAuth } = useAuth();
  const router = useRouter();

  async function onLogOutACB() {
    await fetch("/api/logout", {
      method: "GET",
    });
    refreshAuth();
    router.replace("/");
  }

  type NavItem = {
    key: string;
    href?: string;
    onClick?: () => void;
  };

  const navItemsDefault: NavItem[] = [
    { key: "home", href: "/" },
    { key: "about", href: "/about" },
    { key: "login", href: "/login" },
    { key: "register", href: "/register" },
  ];

  const navItemsAuthenticated: NavItem[] =
    userData?.role === "recruiter"
      ? [
          { key: "home", href: "/" },
          { key: "admin", href: "/admin" },
          { key: "profile", href: "/profile" },
          { key: "logout", onClick: onLogOutACB },
        ]
      : [
          { key: "home", href: "/" },
          { key: "about", href: "/about" },
          { key: "apply", href: "/apply" },
          { key: "profile", href: "/profile" },
          { key: "logout", onClick: onLogOutACB },
        ];

  return (
    <nav>
      <ul className="flex gap-12">
        {(status === AuthStatus.Authenticated ? navItemsAuthenticated : navItemsDefault).map((item) => (
          <li key={item.key}>
            <Link
              href={item.href || "#"}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={item.onClick ? item.onClick : undefined}
            >
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
