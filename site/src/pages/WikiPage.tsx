import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-');
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

// 표의 헤더(thead) 텍스트만 추출한다. 답변 셀 내용은 제외해 오탐을 막는다.
function tableHeaderText(children: ReactNode): string {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && typeof child === 'object' && 'type' in child && (child as { type?: unknown }).type === 'thead') {
      return extractText((child as { props?: { children?: ReactNode } }).props?.children);
    }
  }
  return '';
}

function buildToc(content: string): TocItem[] {
  const seen = new Map<string, number>();
  return content
    .split('\n')
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const level = match[1].length;
      const text = match[2].replace(/#+$/, '').trim();
      const baseId = slugify(text) || 'section';
      const count = seen.get(baseId) ?? 0;
      seen.set(baseId, count + 1);
      return {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        text,
        level,
      };
    });
}

export function WikiPage() {
  const { pathname } = useLocation();
  const mdPath = pathname.replace('/wiki/', '');
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setContent(null);
    setError(false);
    setQuizMode(false);
    fetch(`./data/wiki/${mdPath}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.text();
      })
      .then(setContent)
      .catch(() => setError(true));
  }, [mdPath]);

  if (error) {
    return <div className="text-text-muted text-sm">문서를 찾을 수 없습니다: {mdPath}</div>;
  }

  if (content === null) {
    return <div className="text-text-muted text-sm">Loading...</div>;
  }

  // Compute base path for relative links (e.g., "asset-factory/팩토리-파이프라인/" from "asset-factory/팩토리-파이프라인/README.md")
  const basePath = mdPath.includes('/') ? mdPath.substring(0, mdPath.lastIndexOf('/') + 1) : '';
  const toc = buildToc(content);
  const renderedHeadingCounts = new Map<string, number>();

  const nextHeadingId = (text: string) => {
    const baseId = slugify(text) || 'section';
    const count = renderedHeadingCounts.get(baseId) ?? 0;
    renderedHeadingCounts.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  };

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (!target || typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({ block: 'start' });
  };

  // 퀴즈 모드를 켤 때는 이전에 공개된 답을 다시 가린다.
  const toggleQuiz = () => {
    setQuizMode((prev) => {
      const next = !prev;
      if (next) {
        articleRef.current?.querySelectorAll('td.revealed').forEach((cell) => cell.classList.remove('revealed'));
      }
      return next;
    });
  };

  // 퀴즈 모드에서 답변(마지막) 셀을 클릭하면 공개를 토글한다.
  const handleReveal = (event: MouseEvent<HTMLElement>) => {
    if (!quizMode) return;
    const cell = (event.target as HTMLElement).closest('td');
    if (!cell || cell !== cell.parentElement?.lastElementChild) return;
    if (!cell.closest('table')?.classList.contains('quiz-table')) return;
    cell.classList.toggle('revealed');
  };

  const hasQuizTable = /\|[^|\n]*답변[^|\n]*\|/.test(content);

  const components: Components = {
    h2: ({ children, ...props }) => {
      const text = extractText(children);
      return (
        <h2 id={nextHeadingId(text)} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = extractText(children);
      return (
        <h3 id={nextHeadingId(text)} {...props}>
          {children}
        </h3>
      );
    },
    table: ({ children, ...props }) => {
      const isQuiz = tableHeaderText(children).includes('답변');
      return (
        <table className={isQuiz ? 'quiz-table' : undefined} {...props}>
          {children}
        </table>
      );
    },
    a: ({ href, children, ...props }) => {
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        // Resolve relative link to hash router path
        const resolved = new URL(href, `http://x/${basePath}`).pathname.slice(1);
        return (
          <a href={`#/wiki/${resolved}`} className="text-accent hover:underline" {...props}>
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,760px)_220px] lg:items-start lg:justify-center">
      <article
        ref={articleRef}
        className={`wiki-content min-w-0 ${quizMode ? 'quiz-mode' : ''}`}
        onClick={handleReveal}
      >
        {hasQuizTable && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={toggleQuiz}
              aria-pressed={quizMode}
              className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                quizMode
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border text-text-muted hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              {quizMode ? '✓ 퀴즈 모드 · 답을 클릭해 공개' : '🎯 퀴즈 모드 (답 가리기)'}
            </button>
          </div>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </article>

      {toc.length > 0 && (
        <aside className="order-first rounded-[8px] border border-border bg-bg-card p-3 lg:sticky lg:top-24 lg:order-none lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="mb-2 text-[12px] font-semibold text-text-dim">문서 목차</div>
          <nav className="grid gap-1">
            {toc.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`rounded-md px-2 py-1.5 text-left text-[12px] leading-snug transition-colors hover:bg-bg-hover hover:text-text-primary ${
                  item.level === 3 ? 'pl-4 text-text-dim' : 'font-medium text-text-muted'
                }`}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}
