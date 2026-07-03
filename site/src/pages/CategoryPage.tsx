import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOntology } from '@/hooks/useOntologyData';
import { DOMAIN_ICONS, TYPE_LABELS, TYPE_ORDER } from '@/lib/constants';
import { findCategoryGroup } from '@/lib/categories';
import type { Entity } from '@/lib/types';

function groupEntities(entities: Entity[]) {
  const grouped = new Map<string, Entity[]>();
  for (const entity of entities) {
    const list = grouped.get(entity.type) ?? [];
    list.push(entity);
    grouped.set(entity.type, list);
  }

  return Array.from(grouped.entries()).sort(([a], [b]) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function CategoryPage() {
  const { id } = useParams();
  const { ontology, wikiIndex } = useOntology();

  if (!ontology) {
    return <div className="text-text-muted text-sm">Loading...</div>;
  }

  const domain = ontology.domains.find((item) => item.id === id);
  if (!domain) {
    return <div className="text-text-muted text-sm">카테고리를 찾을 수 없습니다: {id}</div>;
  }

  const icon = DOMAIN_ICONS[domain.id] ?? { emoji: 'CS', color: '#71717a', bg: 'rgba(113,113,122,0.12)' };
  const group = findCategoryGroup(domain.id);
  const docs = wikiIndex?.docs.filter((doc) => doc.domain === domain.id) ?? [];
  const primaryDoc = docs.find((doc) => doc.path.endsWith('/README.md')) ?? docs[0];
  const groupedEntities = groupEntities(domain.entities);

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className="border-b border-border pb-5 sm:pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-text-dim">
          <Link to="/" className="hover:text-text-primary">Home</Link>
          <span>/</span>
          <span>{group?.title ?? 'Category'}</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[11px] font-bold sm:h-12 sm:w-12 sm:text-[12px]"
              style={{ background: icon.bg, color: icon.color }}
            >
              {icon.emoji}
            </div>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">{domain.name}</h1>
              <p className="mt-2 max-w-[780px] text-[14px] leading-relaxed text-text-muted">{domain.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {primaryDoc && (
              <Link
                to={`/wiki/${primaryDoc.path}`}
                className="rounded-md bg-accent px-3 py-2 text-center text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
              >
                대표 문서
              </Link>
            )}
            <Link
              to={`/graph/domain/${domain.id}`}
              className="rounded-md border border-border px-3 py-2 text-center text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              관계 그래프
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="space-y-7">
          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">면접 답변 목차</h2>
                <p className="mt-1 text-[13px] text-text-muted">질문을 받았을 때 먼저 꺼낼 개념을 타입별로 정리했습니다.</p>
              </div>
              <span className="shrink-0 text-[12px] text-text-dim">{domain.entities.length} concepts</span>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-border bg-bg-card">
              {groupedEntities.map(([type, entities], groupIndex) => (
                <div key={type} className={groupIndex > 0 ? 'border-t border-border' : ''}>
                  <div className="bg-bg-hover px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-text-dim">
                    {TYPE_LABELS[type] ?? type}
                  </div>
                  {entities.map((entity, index) => (
                    <div
                      key={entity.id}
                      className={`grid gap-2 px-4 py-4 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-3 ${
                        index > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div className="text-[12px] font-semibold text-text-dim">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold">{entity.name}</div>
                        <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{entity.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold tracking-tight">관계 요약</h2>
            <div className="overflow-hidden rounded-[8px] border border-border bg-bg-card">
              {domain.relations.slice(0, 12).map((relation, index) => (
                <div
                  key={`${relation.from}-${relation.to}-${index}`}
                  className={`grid gap-2 px-4 py-3 text-[13px] md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] ${
                    index > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <span className="truncate font-medium">{relation.from}</span>
                  <span className="text-text-dim">{relation.type}</span>
                  <span className="truncate text-text-muted">{relation.to}</span>
                </div>
              ))}
              {domain.relations.length === 0 && (
                <div className="px-4 py-4 text-[13px] text-text-muted">등록된 관계가 없습니다.</div>
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-3">
          <Panel title="연결 문서">
            <div className="space-y-2">
              {docs.length === 0 ? (
                <p className="text-[13px] text-text-muted">연결된 문서가 없습니다.</p>
              ) : (
                docs.map((doc) => (
                  <Link
                    key={doc.path}
                    to={`/wiki/${doc.path}`}
                    className="block rounded-md border border-border px-3 py-2 text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    {doc.title}
                  </Link>
                ))
              )}
            </div>
          </Panel>

          <Panel title="카테고리 메타">
            <dl className="space-y-2 text-[13px]">
              <InfoRow label="Group" value={group?.title ?? '-'} />
              <InfoRow label="Concepts" value={String(domain.entities.length)} />
              <InfoRow label="Relations" value={String(domain.relations.length)} />
              <InfoRow label="Path" value={domain.path} />
            </dl>
          </Panel>

          <Panel title="전체 문서">
            <div className="space-y-2">
              <QuickLink to="/wiki/interview-checklist.md">면접 체크리스트</QuickLink>
              <QuickLink to="/wiki/study-roadmap.md">학습 로드맵</QuickLink>
              <QuickLink to="/wiki/glossary.md">용어 사전</QuickLink>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[8px] border border-border bg-bg-card p-4">
      <h2 className="mb-3 text-[14px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-dim">{label}</dt>
      <dd className="min-w-0 text-right text-text-muted">{value}</dd>
    </div>
  );
}

function QuickLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-md bg-bg-tag px-3 py-2 text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
