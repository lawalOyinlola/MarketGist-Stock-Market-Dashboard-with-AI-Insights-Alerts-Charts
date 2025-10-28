import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { AlertProvider } from "@/components/AlertProvider";
import { NotificationPoller } from "@/components/NotificationPoller";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getAlertsByEmail } from "@/lib/actions/alert.actions";
// Defer heavy Finnhub fetches to the client to avoid blocking SSR

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email,
  };

  // Preload only lightweight data (symbols, alerts). Defer Finnhub data to client.
  const [initialWatchlistSymbols, initialAlerts] = session.user.email
    ? await Promise.all([
        getWatchlistSymbolsByEmail(session.user.email),
        getAlertsByEmail(session.user.email),
      ])
    : ([[], []] as [string[], AlertData[]]);

  return (
    <main className="min-h-screen text-gray-400">
      <WatchlistProvider
        initialSymbols={initialWatchlistSymbols}
        initialWatchlistData={[]}
        email={session.user.email}
      >
        <AlertProvider initialAlerts={initialAlerts}>
          <NotificationPoller />
          <Header user={user} />
          <div className="container py-10">{children}</div>
        </AlertProvider>
      </WatchlistProvider>
    </main>
  );
};
export default Layout;
