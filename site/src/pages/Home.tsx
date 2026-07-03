import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOntology } from '@/hooks/useOntologyData';
import { DOMAIN_ICONS } from '@/lib/constants';
import { CATEGORY_GROUPS } from '@/lib/categories';

export function Home() {
  const { ontology, wikiIndex } = useOntology();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!ontology) {
      return [];
    }

    return CATEGORY_GROUPS.map((group) => {
      const domains = group.domainIds
        .map((id) => ontology.domains.find((domain) => domain.id === id))
        .filter((domain): domain is NonNullable<typeof domain> => Boolean(domain))
        .filter((domain) => {
          if (!normalizedQuery) {
            return true;
          }

          const haystack = [
            domain.name,
            domain.summary,
            domain.id,
            ...domain.entities.map((entity) => `${entity.name} ${entity.summary}`),
          ]
            .join(' ')
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        });

      return { ...group, domains };
    }).filter((group) => group.domains.length > 0);
  }, [normalizedQuery, ontology]);

  if (!ontology) {
    return <div className="text-text-muted text-sm">Loading...</div>;
  }

  const totalConcepts = ontology.domains.reduce((sum, domain) => sum + domain.entities.length, 0);
  const wikiDocCount = wikiIndex?.docs.length ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="border-b border-border pb-6 sm:pb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">CS Interview Notes</div>
            <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight sm:text-[40px]">
              면접 질문을 카테고리별 문서로 빠르게 찾습니다
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              그래프 탐색 대신 질문 목록, 핵심 개념, 연결 문서를 한 화면에서 확인할 수 있도록 정리했습니다.
              백엔드, 웹/네트워크, CS 기본기, 아키텍처/운영 순서로 훑어보면 됩니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-[8px] border border-border bg-bg-card p-3 sm:gap-4 sm:p-4 lg:w-[340px]">
            <Metric label="Categories" value={ontology.domains.length} />
            <Metric label="Concepts" value={totalConcepts} />
            <Metric label="Docs" value={wikiDocCount} />
          </div>
        </div>

        <label className="mt-6 block">
          <span className="sr-only">카테고리 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 트랜잭션, Redis, 테스트, CAP, Kafka"
            className="h-12 w-full rounded-[8px] border border-border bg-bg px-4 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent"
          />
        </label>
      </section>

      {visibleGroups.length === 0 ? (
        <section className="border border-border bg-bg-card p-6 rounded-[8px] text-[14px] text-text-muted">
          검색 결과가 없습니다. 다른 키워드로 다시 검색해 주세요.
        </section>
      ) : (
        <section className="space-y-8">
          {visibleGroups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-24">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[20px] font-semibold tracking-tight">{group.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{group.description}</p>
                </div>
                <span className="text-[12px] text-text-dim">{group.domains.length} categories</span>
              </div>

              {group.focusSections && (
                <div className="mb-4 overflow-hidden rounded-[8px] border border-border bg-bg-card">
                  <div className="border-l-4 border-accent bg-bg-code px-4 py-3">
                    <h3 className="text-[15px] font-semibold tracking-tight">핵심 섹션 맵</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                      Backend Core는 아래 순서로 답변 축을 잡으면 Java, Spring, 저장소, 메시징 질문을 하나의 서버 흐름으로 연결할 수 있습니다.
                    </p>
                  </div>

                  {group.focusSections.map((section, index) => {
                    const linkedDomains = section.domainIds
                      .map((domainId) => group.domains.find((domain) => domain.id === domainId))
                      .filter((domain): domain is NonNullable<typeof domain> => Boolean(domain));

                    return (
                      <div
                        key={section.title}
                        className={`grid gap-3 px-4 py-4 lg:grid-cols-[54px_minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)] ${
                          index > 0 ? 'border-t border-border' : ''
                        }`}
                      >
                        <div className="text-[12px] font-semibold text-accent">
                          {String(section.priority).padStart(2, '0')}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-text-primary">{section.title}</div>
                        </div>
                        <p className="text-[13px] leading-relaxed text-text-muted">{section.question}</p>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {linkedDomains.map((domain) => {
                            const doc = wikiIndex?.docs.find((item) => item.domain === domain.id && item.path.endsWith('/README.md'));
                            return doc ? (
                              <Link
                                key={domain.id}
                                to={`/wiki/${doc.path}`}
                                className="rounded-md border border-border px-2.5 py-1.5 text-[12px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                              >
                                {domain.name}
                              </Link>
                            ) : (
                              <Link
                                key={domain.id}
                                to={`/domain/${domain.id}`}
                                className="rounded-md border border-border px-2.5 py-1.5 text-[12px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                              >
                                {domain.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="overflow-hidden rounded-[8px] border border-border bg-bg-card">
                {group.domains.map((domain, index) => {
                  const icon = DOMAIN_ICONS[domain.id] ?? { emoji: 'CS', color: '#71717a', bg: 'rgba(113,113,122,0.12)' };
                  const doc = wikiIndex?.docs.find((item) => item.domain === domain.id && item.path.endsWith('/README.md'));

                  return (
                    <div
                      key={domain.id}
                      className={`grid gap-3 px-4 py-4 md:grid-cols-[42px_minmax(0,1fr)_150px] md:items-center ${
                        index > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold"
                        style={{ background: icon.bg, color: icon.color }}
                      >
                        {icon.emoji}
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={`/domain/${domain.id}`}
                          className="text-[16px] font-semibold tracking-tight hover:text-accent transition-colors"
                        >
                          {domain.name}
                        </Link>
                        <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{domain.summary}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-dim">
                          <span>{domain.entities.length} concepts</span>
                          <span>{domain.relations.length} relations</span>
                          <span>{doc ? 'README linked' : 'No README'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
                        <Link
                          to={`/domain/${domain.id}`}
                          className="rounded-md bg-accent-dim px-3 py-2 text-center text-[12px] font-medium text-accent hover:opacity-85 transition-opacity"
                        >
                          열기
                        </Link>
                        {doc && (
                          <Link
                            to={`/wiki/${doc.path}`}
                            className="rounded-md border border-border px-3 py-2 text-center text-[12px] text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                          >
                            문서
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      )}

      <section className="border-t border-border pt-6">
        <div className="grid gap-2 md:grid-cols-3">
          <QuickLink title="면접 체크리스트" path="/wiki/interview-checklist.md" />
          <QuickLink title="학습 로드맵" path="/wiki/study-roadmap.md" />
          <QuickLink title="용어 사전" path="/wiki/glossary.md" />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-text-dim">{label}</div>
      <div className="mt-1 text-[20px] font-bold tracking-tight sm:text-[24px]">{value}</div>
    </div>
  );
}

function QuickLink({ title, path }: { title: string; path: string }) {
  return (
    <Link
      to={path}
      className="flex items-center justify-between rounded-[8px] border border-border bg-bg-card px-4 py-3 text-[14px] font-medium hover:bg-bg-hover transition-colors"
    >
      <span>{title}</span>
      <span className="text-[12px] text-text-dim">보기</span>
    </Link>
  );
}
