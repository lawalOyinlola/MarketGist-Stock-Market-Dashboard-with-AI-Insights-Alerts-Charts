import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { AlertProvider } from "@/components/AlertProvider";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getAlertsByEmail } from "@/lib/actions/alert.actions";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email,
  };

  // Preload user's watchlist and alerts to hydrate client store
  const [initialWatchlistSymbols, initialAlerts] = session.user.email
    ? await Promise.all([
        getWatchlistSymbolsByEmail(session.user.email),
        getAlertsByEmail(session.user.email),
      ])
    : [[], []];

  return (
    <main className="min-h-screen text-gray-400">
      <WatchlistProvider initialSymbols={initialWatchlistSymbols}>
        <AlertProvider initialAlerts={initialAlerts}>
          <Header user={user} />
          <div className="container py-10">{children}</div>
        </AlertProvider>
      </WatchlistProvider>
    </main>
  );
};
export default Layout;
