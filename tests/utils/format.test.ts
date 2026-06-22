import { describe, it, expect } from 'vitest';
import { pluralize, formatMs, formatPct } from '../../src/utils/format';

describe('format', () => {
  it('pluralize', () => { expect(pluralize(1, 'item')).toBe('1 item'); expect(pluralize(3, 'item')).toBe('3 items'); });
  it('formatMs', () => { expect(formatMs(3000)).toBe('3.0s'); expect(formatMs(500)).toBe('0.5s'); });
  it('formatPct', () => { expect(formatPct(0.75)).toBe('75%'); expect(formatPct(1)).toBe('100%'); });
});
