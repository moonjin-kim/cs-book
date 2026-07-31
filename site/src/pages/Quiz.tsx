import { useEffect, useMemo, useState } from 'react';

interface QuizQuestion {
  q: string;
  a: string;
  group: string;
}

interface QuizDomain {
  id: string;
  name: string;
  count: number;
  questions: QuizQuestion[];
}

type DrawnQuestion = QuizQuestion & { domain: string };
type Mode = 'random' | 'all';

const DRAW_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Quiz() {
  const [domains, setDomains] = useState<QuizDomain[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>('all');
  const [mode, setMode] = useState<Mode>('random');
  const [started, setStarted] = useState(false);
  const [drawn, setDrawn] = useState<DrawnQuestion[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch('./data/quiz.json')
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => setDomains(data.domains as QuizDomain[]))
      .catch(() => setError(true));
  }, []);

  const poolFor = useMemo(
    () => (topic: string): DrawnQuestion[] => {
      if (!domains) return [];
      const target = topic === 'all' ? domains : domains.filter((d) => d.id === topic);
      return target.flatMap((d) => d.questions.map((q) => ({ ...q, domain: d.name })));
    },
    [domains],
  );

  const selectTopic = (topic: string, nextMode: Mode = mode) => {
    setSelected(topic);
    setMode(nextMode);
    setStarted(true);
    setRevealed(new Set());
    setNotes({});
    if (nextMode === 'random') setDrawn(shuffle(poolFor(topic)).slice(0, DRAW_SIZE));
  };

  const redraw = () => {
    setDrawn(shuffle(poolFor(selected)).slice(0, DRAW_SIZE));
    setRevealed(new Set());
    setNotes({});
  };

  const toggleReveal = (index: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (error) {
    return <div className="text-text-muted text-sm">퀴즈 데이터를 불러오지 못했습니다.</div>;
  }
  if (!domains) {
    return <div className="text-text-muted text-sm">Loading...</div>;
  }

  const totalQuestions = domains.reduce((sum, d) => sum + d.count, 0);
  const list = mode === 'random' ? drawn : poolFor(selected);
  const allRevealed = list.length > 0 && revealed.size === list.length;

  return (
    <div className="mx-auto max-w-[820px] space-y-6">
      <section className="border-b border-border pb-5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-accent">Quiz</div>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight sm:text-[32px]">주제별 퀴즈</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-muted">
          주제를 고르고 <b>랜덤 {DRAW_SIZE}문제</b> 또는 <b>전체 보기</b>를 선택하세요. 질문을 보고 답을 떠올린 뒤
          카드를 눌러 확인합니다. 전체 {totalQuestions}문항.
        </p>
      </section>

      <section className="space-y-3">
        <div>
          <div className="mb-2 text-[12px] font-semibold text-text-dim">모드</div>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(['random', 'all'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectTopic(selected, m)}
                className={`rounded px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  mode === m ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {m === 'random' ? `랜덤 ${DRAW_SIZE}문제` : '전체 보기'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[12px] font-semibold text-text-dim">주제 선택</div>
          <div className="flex flex-wrap gap-2">
            <TopicChip label="전체" count={totalQuestions} active={selected === 'all'} onClick={() => selectTopic('all')} />
            {domains.map((d) => (
              <TopicChip
                key={d.id}
                label={d.name}
                count={d.count}
                active={selected === d.id}
                onClick={() => selectTopic(d.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {!started ? (
        <section className="rounded-[8px] border border-dashed border-border bg-bg-card px-6 py-10 text-center">
          <div className="text-[15px] font-medium text-text-primary">주제를 선택해 퀴즈를 시작하세요</div>
          <button
            type="button"
            onClick={() => selectTopic(selected)}
            className="mt-4 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
          >
            시작하기
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[13px] text-text-muted">
              {mode === 'random' ? '랜덤' : '전체'} {list.length}문제 · 공개 {revealed.size}/{list.length}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRevealed(allRevealed ? new Set() : new Set(list.map((_, i) => i)))}
                className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                {allRevealed ? '모두 가리기' : '모두 공개'}
              </button>
              {mode === 'random' && (
                <button
                  type="button"
                  onClick={redraw}
                  className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
                >
                  🎲 다시 뽑기
                </button>
              )}
            </div>
          </div>

          <ol className="space-y-3">
            {list.map((item, index) => {
              const showGroupHeader = mode === 'all' && item.group && item.group !== list[index - 1]?.group;
              const isRevealed = revealed.has(index);
              return (
                <li key={index}>
                  {showGroupHeader && (
                    <div className="mb-2 mt-5 text-[13px] font-semibold text-text-primary first:mt-0">
                      {selected === 'all' ? `${item.domain} · ${item.group}` : item.group}
                    </div>
                  )}
                  <div className="overflow-hidden rounded-[8px] border border-border bg-bg-card">
                    <div className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 text-[12px] font-semibold text-accent">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        {mode === 'random' && (
                          <div className="mb-1 flex flex-wrap gap-1.5 text-[11px] text-text-dim">
                            <span className="rounded bg-bg-tag px-1.5 py-0.5">{item.domain}</span>
                            {item.group && <span className="rounded bg-bg-tag px-1.5 py-0.5">{item.group}</span>}
                          </div>
                        )}
                        <p className="text-[15px] font-medium leading-relaxed text-text-primary">{item.q}</p>
                        <input
                          type="text"
                          value={notes[index] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [index]: e.target.value }))}
                          placeholder="생각한 답 적어보기 (선택)"
                          className="mt-2 w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent"
                        />
                      </div>
                    </div>
                    {isRevealed ? (
                      <div
                        className="cursor-pointer border-t border-border bg-bg-code px-4 py-3 text-[14px] leading-relaxed text-text-muted"
                        onClick={() => toggleReveal(index)}
                      >
                        {item.a}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleReveal(index)}
                        className="w-full border-t border-border px-4 py-2.5 text-left text-[13px] font-medium text-accent transition-colors hover:bg-bg-hover"
                      >
                        답 보기
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

function TopicChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? 'border-accent bg-accent-dim text-accent'
          : 'border-border text-text-muted hover:bg-bg-hover hover:text-text-primary'
      }`}
    >
      {label} <span className="text-text-dim">{count}</span>
    </button>
  );
}
