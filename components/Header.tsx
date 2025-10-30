import Link from "next/link";
import Image from "next/image";
import HeaderNavWrapper from "./HeaderNavWrapper";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
  const stocks = await searchStocks();
  const initialStocks: StockWithWatchlistStatus[] = stocks.map((stock) => ({
    ...stock,
    isInWatchlist: false, // Will be updated by client context
  }));

  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image
            src="/assets/images/logo-marketgist.svg"
            alt="Marketgist Logo"
            width={90}
            height={20}
            className="h-8 w-auto cursor-pointer"
          />
        </Link>
        <HeaderNavWrapper user={user} initialStocks={initialStocks} />
      </div>
    </header>
  );
};
export default Header;
