import { Link, NavLink } from 'react-router-dom';
import { useOntology } from '@/hooks/useOntologyData';
import { CATEGORY_GROUPS } from '@/lib/categories';
import { ThemeToggle } from './ThemeToggle';

export function TopNavigation() {
  const { ontology } = useOntology();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="h-16 flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0">
            <div className="text-[15px] font-bold tracking-tight">CS Interview Notes</div>
            <div className="text-[11px] text-text-dim">Backend CS knowledge base</div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 min-w-0">
            {CATEGORY_GROUPS.map((group) => (
              <Link
                key={group.id}
                to="/"
                className="px-3 py-2 rounded-md text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                {group.title}
              </Link>
            ))}
            <NavLink
              to="/wiki/interview-checklist.md"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive ? 'bg-accent-dim text-accent' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`
              }
            >
              Checklist
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block text-[12px] text-text-dim">
              {ontology ? `${ontology.domains.length} categories` : 'Loading'}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
