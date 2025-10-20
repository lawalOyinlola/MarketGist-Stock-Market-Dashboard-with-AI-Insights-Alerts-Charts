import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email,
  };

  // Preload user's watchlist symbols to hydrate client store
  const initialWatchlistSymbols = session.user.email
    ? await getWatchlistSymbolsByEmail(session.user.email)
    : [];

  return (
    <main className="min-h-screen text-gray-400">
      <WatchlistProvider initialSymbols={initialWatchlistSymbols}>
        <Header user={user} />
        <div className="container py-10">{children}</div>
      </WatchlistProvider>
    </main>
  );
};
export default Layout;
