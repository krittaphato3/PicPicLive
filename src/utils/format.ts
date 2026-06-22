export const pluralize = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
export const formatPct = (n: number) => `${Math.round(n * 100)}%`;
