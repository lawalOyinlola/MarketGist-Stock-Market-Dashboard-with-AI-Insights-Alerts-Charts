"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchCommand from "./SearchCommand";
import { NAV_ITEMS } from "@/lib/constants";

const NavItems = ({
  initialStocks,
  onItemClick,
}: {
  initialStocks: StockWithWatchlistStatus[];
  onItemClick?: () => void;
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";

    return pathname.startsWith(path);
  };

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        if (href === "/search")
          return (
            <li key="search-trigger" onClick={handleItemClick}>
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
              />
            </li>
          );

        return (
          <li key={href} onClick={handleItemClick}>
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
