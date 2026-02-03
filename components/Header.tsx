import { Nav } from "./Nav";
import Link from "next/link";

/**
 * Header component displaying the application logo and navigation.
 */
export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            <Link href="/">RecruitApp</Link>
          </div>
          <Nav />
        </div>
      </div>
    </header>
  );
}
