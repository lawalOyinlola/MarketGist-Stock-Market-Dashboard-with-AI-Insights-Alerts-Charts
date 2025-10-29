"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchCommand from "./SearchCommand";
import { NAV_ITEMS } from "@/lib/constants";

const NavItems = ({
  initialStocks,
  onItemClick,
  onNavigate,
}: {
  initialStocks: StockWithWatchlistStatus[];
  onItemClick?: () => void;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";

    return pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        if (href === "/search")
          return (
            <li key="search-trigger">
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
                onNavigate={onNavigate}
              />
            </li>
          );

        return (
          <li key={href} onClick={handleLinkClick}>
            <Link
              href={href}
              className={`hover:text-app-color transition-colors ${
                isActive(href) ? "text-gray-100" : ""
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
export default NavItems;
