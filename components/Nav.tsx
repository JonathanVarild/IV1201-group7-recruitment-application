"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Navigation component displaying links to different pages.
 */
export function Nav() {
  const t = useTranslations("Nav");

  const navItems = [
    { key: "home", href: "/" },
    { key: "apply", href: "/apply" },
    { key: "about", href: "/about" },
  ];

  return (
    <nav>
      <ul className="flex gap-12">
        {navItems.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
