import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { NotificationPoller } from "@/components/NotificationPoller";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getAlertsByEmail } from "@/lib/actions/alert.actions";
import GuestWrapper from "@/components/GuestWrapper";
// Defer heavy Finnhub fetches to the client to avoid blocking SSR

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  // Make authentication optional - allow guest access
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email,
      }
    : null;

  // Preload only lightweight data (symbols, alerts). Defer Finnhub data to client.
  const [initialWatchlistSymbols, initialAlerts] = session?.user?.email
    ? await Promise.all([
        getWatchlistSymbolsByEmail(session.user.email),
        getAlertsByEmail(session.user.email),
      ])
    : ([[], []] as [string[], AlertData[]]);

  return (
    <main className="min-h-screen text-gray-400">
      <GuestWrapper
        initialWatchlistSymbols={initialWatchlistSymbols}
        initialWatchlistData={[]}
        initialAlerts={initialAlerts}
        authenticatedEmail={session?.user?.email}
      >
        {session?.user && <NotificationPoller />}
        <Header user={user} />
        <div className="container py-10">{children}</div>
      </GuestWrapper>
    </main>
  );
};
export default Layout;
