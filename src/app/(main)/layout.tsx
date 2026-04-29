import { Navbar } from "@/components/layout/Navbar";
import { MainContentMotion } from "@/components/motion/MainContentMotion";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Container } from "@/components/ui/Container";
import { getAuthContext } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects unauthenticated users to /login, so `auth`
  // will normally be non-null here. Reading it in the layout lets the theme
  // be applied on first paint with no client-side flash.
  const auth = await getAuthContext();

  return (
    <ThemeProvider team={auth?.team ?? null} profile={auth?.profile ?? null}>
      <Navbar />
      <main className="relative z-[1] flex-1 py-6 sm:py-10">
        <Container>
          <MainContentMotion>{children}</MainContentMotion>
        </Container>
      </main>
      <footer className="relative z-[1] border-t border-surface-border/80 glass-panel-soft">
        <Container className="flex min-h-12 flex-col items-start justify-center gap-1 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-heading">Cup26 Arena</span>
          <span className="text-muted">World Cup 2026 predictions</span>
        </Container>
      </footer>
    </ThemeProvider>
  );
}
