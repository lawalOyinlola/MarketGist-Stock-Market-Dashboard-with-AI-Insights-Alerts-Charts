interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
  },
  {
    href: "/search",
    label: "Search",
  },
  {
    href: "/watchlist",
    label: "Watchlist",
  },
];
