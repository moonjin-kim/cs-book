export const DOMAIN_COLORS: Record<string, string> = {

};

export const DOMAIN_ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
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
  process: 'Process',
  data: 'Data',
  infra: 'Infrastructure',
  external: 'External',
  table: 'Table',
  service: 'Service',
};

export const TYPE_ORDER = ['service', 'process', 'data', 'table', 'external', 'infra'];

export const EDGE_STYLES: Record<string, { stroke: string; opacity: number; dasharray?: string }> = {
  consumes: { stroke: '#60a5fa', opacity: 0.35 },
  produces: { stroke: '#34d399', opacity: 0.35 },
  triggers: { stroke: '#facc15', opacity: 0.35, dasharray: '6 4' },
  depends_on: { stroke: '#a1a1aa', opacity: 0.2, dasharray: '3 3' },
};

export const DEFAULT_EDGE = { stroke: '#2a2a32', opacity: 0.4 };
