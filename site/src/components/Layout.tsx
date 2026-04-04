import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

function Breadcrumb() {
  const { pathname } = useLocation();

  let label = 'Overview';
  if (pathname.startsWith('/domain/')) {
    const id = pathname.replace('/domain/', '');
    label = decodeURIComponent(id);
  } else if (pathname === '/overview') {
    label = 'Ontology Graph';
  } else if (pathname.startsWith('/wiki/')) {
    const path = pathname.replace('/wiki/', '');
    label = decodeURIComponent(path);
  }

  return (
    <div className="text-[13px] text-text-muted">
      Command Center
      <span className="text-text-dim mx-1.5">/</span>
      <span className="text-text-primary font-medium">{label}</span>
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex h-screen bg-bg text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[52px] shrink-0 border-b border-border flex items-center px-6">
          <Breadcrumb />
        </div>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
