type Handler = (e: KeyboardEvent) => void;
const registry: { combo: string; handler: Handler; allowWhileTyping: boolean; when: (e: KeyboardEvent) => boolean }[] = [];

function comboOf(e: KeyboardEvent): string {
  return `${e.ctrlKey || e.metaKey ? 'mod+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
}

export function registerKey(combo: string, handler: Handler, opts: { allowWhileTyping?: boolean; when?: (e: KeyboardEvent) => boolean } = {}): void {
  registry.push({
    combo: combo.toLowerCase(),
    handler,
    allowWhileTyping: opts.allowWhileTyping ?? false,
    when: opts.when ?? (() => true),
  });
}

export function installKeyboard(): void {
  document.addEventListener('keydown', (e) => {
    const typing = isTyping();
    const combo = comboOf(e);
    for (const r of registry) {
      if (r.combo === combo && (!typing || r.allowWhileTyping) && r.when(e)) {
        r.handler(e);
        return;
      }
    }
  });
}

function isTyping(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}
