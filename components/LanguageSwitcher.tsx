"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * Language switcher dropdown for changing the application locale.
 * Supports English and Swedish languages.
 *
 * @returns {JSX.Element} The rendered LanguageSwitcher component.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "sv", label: "Svenska" },
  ];

  const currentLanguage = languages.find((language) => language.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem key={language.code} onClick={() => switchLocale(language.code)} className="gap-2 cursor-pointer">
            <span>{language.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
