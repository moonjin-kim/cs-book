import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { TopNavigation } from './TopNavigation';

export function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <TopNavigation />
      <main className="mx-auto max-w-[1180px] px-5 py-8">
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
