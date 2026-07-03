import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useOntology } from '@/hooks/useOntologyData';
import { CATEGORY_GROUPS } from '@/lib/categories';
import { ThemeToggle } from './ThemeToggle';

export function TopNavigation() {
  const { ontology } = useOntology();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-5">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          <Link to="/" className="min-w-0 shrink">
            <div className="text-[15px] font-bold tracking-tight">CS Interview Notes</div>
            <div className="hidden text-[11px] text-text-dim sm:block">Backend CS knowledge base</div>
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
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="h-9 rounded-md border border-border px-3 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary lg:hidden"
            >
              메뉴
            </button>
            <ThemeToggle />
          </div>
        </div>

        {mobileMenuOpen && (
          <nav id="mobile-navigation" className="grid gap-2 border-t border-border py-3 lg:hidden">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md bg-bg-tag px-3 py-2 text-[13px] font-medium text-text-primary"
            >
              홈
            </Link>
            {CATEGORY_GROUPS.map((group) => (
              <Link
                key={group.id}
                to={`/#${group.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-primary"
              >
                {group.title}
              </Link>
            ))}
            <NavLink
              to="/wiki/interview-checklist.md"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-[13px] ${
                  isActive ? 'bg-accent-dim text-accent' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`
              }
            >
              면접 체크리스트
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
