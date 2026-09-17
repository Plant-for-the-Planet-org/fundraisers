import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// The audit reads `locales/` and `src/` relative to the working directory, so each case gets a throwaway
// tree of its own. The script still resolves `typescript` from the repo, because a bare import resolves
// from the importing module rather than from the working directory.
const SCRIPT = join(process.cwd(), 'scripts', 'check-translations.mjs');

const MESSAGES = {
  Alpha: {
    one: 'one',
    other: 'other',
    status: { a: 'a' },
    aria: { b: 'b' },
  },
};

const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function runAudit(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'i18n-audit-'));
  roots.push(root);

  for (const locale of ['en', 'de']) {
    const dir = join(root, 'locales', locale);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'alpha.json'), JSON.stringify(MESSAGES));
  }

  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'component.tsx'), source);

  const run = spawnSync(process.execPath, [SCRIPT], {
    cwd: root,
    encoding: 'utf8',
  });

  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

describe('i18n-used annotations bind to one node', () => {
  it('does not let an annotation reach the opaque call below the one it covers', () => {
    // Binding by a line window let the second call inherit the first call's annotation, which defeated
    // the whole "an opaque call with no annotation is an error" guarantee.
    const { status, output } = runAudit(`
export function C({ status, other }: { status: string; other: string }) {
  const t = useTranslations('Alpha');
  // i18n-used: one
  const first = t(status);
  const second = t(other);
  return <>{first}{second}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:6');
    expect(output).toContain('key comes from a value the audit cannot read');
  });

  it('does not let an annotation reach the translator declared on the next line', () => {
    const { status, output } = runAudit(`
export function C({ key1, key2 }: { key1: string; key2: string }) {
  // i18n-used: *
  const tStatus = useTranslations('Alpha.status');
  const tAria = useTranslations('Alpha.aria');
  return <>{tStatus(key1)}{tAria(key2)}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:6');
    expect(output).toContain('key comes from a value the audit cannot read');
    // The wildcard belongs to tStatus alone, so tAria's namespace is still reported as unused.
    expect(output).toContain('Alpha.aria.b');
  });

  it('accepts a blank line between the annotation and the call', () => {
    const { status } = runAudit(`
export function C({ key1 }: { key1: string }) {
  const t = useTranslations('Alpha');

  // i18n-used: one, other, status.a, aria.b

  return <>{t(key1)}</>;
}
`);

    expect(status).toBe(0);
  });

  it('reads a JSX annotation from the sibling comment container', () => {
    // A JSX comment is not trivia around `{t(key1)}`; it is a sibling node, and on a single line it is a
    // trailing comment of the opening brace rather than a leading comment of the closing one.
    const { status } = runAudit(`
export function C({ key1 }: { key1: string }) {
  const t = useTranslations('Alpha');
  return (
    <span>
      {/* prose that is not an annotation */}
      {/* i18n-used: one, other, status.a, aria.b */}
      {t(key1)}
    </span>
  );
}
`);

    expect(status).toBe(0);
  });

  it('counts stacked annotations together', () => {
    const { status } = runAudit(`
export function C({ key1 }: { key1: string }) {
  const t = useTranslations('Alpha');
  // i18n-used: one, other
  // i18n-used: status.a, aria.b
  return <>{t(key1)}</>;
}
`);

    expect(status).toBe(0);
  });

  it('ignores the marker inside a string literal', () => {
    const { status, output } = runAudit(`
export function C({ key1 }: { key1: string }) {
  const t = useTranslations('Alpha');
  const help = 'write // i18n-used: one, other, status.a, aria.b above the call';
  return <>{help}{t(key1)}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('key comes from a value the audit cannot read');
  });

  it('reports an annotation that covers no call', () => {
    const { status, output } = runAudit(`
export function C() {
  const t = useTranslations('Alpha');
  // i18n-used: one
  return <>{t('one')}{t('other')}{t('status.a')}{t('aria.b')}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:4');
    expect(output).toContain('covers no translator call');
  });
});

describe('a translator bound with no namespace reads the whole key', () => {
  it('resolves keys through a root useTranslations() and binds the namespace file', () => {
    // A missing first argument used to read as "namespace unknown", so alpha.json was reported as a file
    // no component binds and the keys were matched by suffix instead of exactly.
    const { status, output } = runAudit(`
export function C() {
  const tRoot = useTranslations();
  return <>{tRoot('Alpha.one')}</>;
}
`);

    expect(status).toBe(0);
    expect(output).not.toContain('no component binds this namespace');
    // Exact resolution both ways: Alpha.one counts as used, the rest still show up as unused.
    expect(output).not.toContain('Alpha.one');
    expect(output).toContain('Alpha.other');
  });

  it('reads a root getTranslations({ locale }) the same way', () => {
    const { status, output } = runAudit(`
export async function C() {
  const t = await getTranslations({ locale: 'en' });
  return <>{t('Alpha.one')}{t('Alpha.other')}{t('Alpha.status.a')}{t('Alpha.aria.b')}</>;
}
`);

    expect(status).toBe(0);
    expect(output).not.toContain('no component binds this namespace');
    expect(output).not.toContain('look unused');
  });

  it('scopes a template literal and an annotation off a root translator', () => {
    const { status, output } = runAudit(`
export function C({ id, key1 }: { id: string; key1: string }) {
  const tTemplate = useTranslations();
  // i18n-used: Alpha.aria.*
  const tOpaque = useTranslations();
  return <>{tTemplate(\`Alpha.status.\${id}\`)}{tOpaque(key1)}{tTemplate('Alpha.one')}{tTemplate('Alpha.other')}</>;
}
`);

    expect(status).toBe(0);
    expect(output).not.toContain('no component binds this namespace');
    expect(output).not.toContain('look unused');
  });

  it('rejects a namespace the audit cannot read', () => {
    const { status, output } = runAudit(`
export function C({ ns }: { ns: string }) {
  const t = useTranslations(ns);
  return <>{t('one')}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:3');
    expect(output).toContain(
      'namespace comes from a value the audit cannot read'
    );
  });

  it('rejects a namespace passed as a shorthand property', () => {
    const { status, output } = runAudit(`
export async function C({ namespace }: { namespace: string }) {
  const t = await getTranslations({ namespace });
  return <>{t('one')}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain(
      'namespace comes from a value the audit cannot read'
    );
  });
});

describe('i18n-used wildcards need a namespace', () => {
  it('rejects "*" on a translator received as an argument', () => {
    // A passed-in translator has no namespace, so an unscoped "*" used to compile to /^.+$/ and mark
    // every key in every locale file used, which silently turned the audit into a no-op.
    const { status, output } = runAudit(`
type Translator = ReturnType<typeof useTranslations>;

// i18n-used: *
function Helper({ k, t }: { k: string; t: Translator }) {
  return <>{t(k)}</>;
}

export function C() {
  const t = useTranslations('Alpha');
  return <Helper k='one' t={t} />;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:4');
    expect(output).toContain('needs a translator bound to a namespace');
    // The audit still does its job for the keys the wildcard was hiding.
    expect(output).toContain('Alpha.other');
  });

  it('rejects a bare "*" on a root translator', () => {
    const { status, output } = runAudit(`
export function C({ key1 }: { key1: string }) {
  // i18n-used: *
  const t = useTranslations();
  return <>{t(key1)}{t('Alpha.one')}{t('Alpha.other')}{t('Alpha.status.a')}{t('Alpha.aria.b')}</>;
}
`);

    expect(status).toBe(1);
    expect(output).toContain('component.tsx:3');
    expect(output).toContain('needs a namespace to scope it');
  });

  it('still scopes a wildcard on a translator bound to a namespace', () => {
    const { status } = runAudit(`
export function C({ key1, key2 }: { key1: string; key2: string }) {
  // i18n-used: *
  const tStatus = useTranslations('Alpha.status');
  // i18n-used: *
  const tAria = useTranslations('Alpha.aria');
  return <>{tStatus(key1)}{tAria(key2)}{'one'}{'other'}</>;
}

export function D() {
  const t = useTranslations('Alpha');
  return <>{t('one')}{t('other')}</>;
}
`);

    expect(status).toBe(0);
  });
});
