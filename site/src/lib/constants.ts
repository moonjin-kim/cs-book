export const DOMAIN_COLORS: Record<string, string> = {
  network: '#38bdf8',
  database: '#22c55e',
  java: '#f97316',
  spring: '#84cc16',
  oop: '#a78bfa',
  'operating-system': '#eab308',
  'computer-architecture': '#fb7185',
  redis: '#ef4444',
  kafka: '#14b8a6',
  algorithms: '#f59e0b',
  'web-http': '#60a5fa',
  security: '#f43f5e',
  'distributed-systems': '#8b5cf6',
  'devops-cloud': '#06b6d4',
};

export const DOMAIN_ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
  network: { emoji: 'NET', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  database: { emoji: 'DB', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  java: { emoji: 'JVM', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  spring: { emoji: 'SPR', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.12)' },
  oop: { emoji: 'OOP', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  'operating-system': { emoji: 'OS', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  'computer-architecture': { emoji: 'CPU', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.12)' },
  redis: { emoji: 'RDS', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  kafka: { emoji: 'KFK', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)' },
  algorithms: { emoji: 'ALG', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  'web-http': { emoji: 'WEB', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  security: { emoji: 'SEC', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  'distributed-systems': { emoji: 'DS', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  'devops-cloud': { emoji: 'OPS', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
};

export const TYPE_COLORS: Record<string, string> = {
  process: '#60a5fa',
  data: '#34d399',
  infra: '#fb923c',
  external: '#a1a1aa',
  table: '#c084fc',
  service: '#60a5fa',
};

export const TYPE_LABELS: Record<string, string> = {
  process: '동작 원리',
  data: '핵심 개념',
  infra: '인프라',
  external: '외부 시스템',
  table: '데이터 모델',
  service: '서비스',
  'failure-mode': '주의할 점',
};

export const TYPE_ORDER = ['service', 'process', 'data', 'failure-mode', 'table', 'external', 'infra'];

export const EDGE_STYLES: Record<string, { stroke: string; opacity: number; dasharray?: string }> = {
  consumes: { stroke: '#60a5fa', opacity: 0.35 },
  produces: { stroke: '#34d399', opacity: 0.35 },
  triggers: { stroke: '#facc15', opacity: 0.35, dasharray: '6 4' },
  depends_on: { stroke: '#a1a1aa', opacity: 0.2, dasharray: '3 3' },
};

export const DEFAULT_EDGE = { stroke: '#2a2a32', opacity: 0.4 };
