// Translation key audit (the string-level companion to check-locales.mjs).
// check-locales covers the locale files; this script covers the strings inside them.
//
// It reports three things:
//   1. Keys in locales/en that no source file uses. Advisory — printed, never fatal, because a dead key
//      is cleanup work and the resolver can only ever be an approximation.
//   2. Keys present in one locale but not the other. Fatal.
//   3. Namespace files that no component ever binds. Fatal.
// A call site the resolver cannot read, and a stale or malformed `i18n-used:` comment, are also fatal.
//
// Namespace binding is the one project-specific rule it has to know: `useTranslations('Fundraisers.edit')`
// plus `t('title')` resolves to the message key `Fundraisers.edit.title`. Off-the-shelf unused-key tools
// do not model this and would read almost every key as dead.
//
// Dynamic keys:
//   - A template literal becomes a pattern, so t(`tabs.${id}.label`) matches Ns.tabs.<anything>.label.
//   - A key that comes from an opaque value (t(status), t(link.labelKey)) cannot be read from the AST.
//     Those call sites need an `// i18n-used:` comment listing the keys they can produce. An opaque call
//     with no comment is an error, so the audit cannot go quietly stale.
//
// Run with `npm run check:translations`. Deliberately left out of prebuild — see docs/i18n-review.md §13.2.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import ts from 'typescript';

const LOCALES_DIR = 'locales';
const SOURCE_DIR = 'src';
const REFERENCE_LOCALE = 'en';

const TRANSLATOR_FACTORIES = new Set(['useTranslations', 'getTranslations']);

// Members of a translator that still take a message key as the first argument.
const TRANSLATOR_MEMBERS = new Set(['rich', 'markup', 'raw', 'has']);

// Namespace files read by a direct static import instead of through next-intl.
// Their keys never appear in a t() call, so the unused scan has to skip them.
const DIRECT_IMPORT_FILES = new Map([
  [
    'cookie',
    'read by src/lib/constants/cookie-consent-config.ts for vanilla-cookieconsent',
  ],
]);

// `// i18n-used: a, b.c, d.*` — everything up to the end of the line (or the end of a block comment)
// is a comma-separated key list. Prose on the annotation line is rejected, so keep it on its own line.
const ANNOTATION = /i18n-used:\s*([^\n]*?)\s*(?:\*\/|$)/gm;
const ANNOTATION_ENTRY = /^(\*|[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*(\.\*)?)$/;

// How many lines above a call an `i18n-used:` comment may sit and still count as covering it.
const ANNOTATION_LOOKBEHIND = 3;

const errors = [];
const notes = [];

/* -------------------------------------------------------------------------- */
/* Locale inventory                                                            */
/* -------------------------------------------------------------------------- */

// A key segment starting with "_" is an author's note to translators, not a string the app renders.
function isNoteKey(key) {
  return key.split('.').some(segment => segment.startsWith('_'));
}

function flatten(value, prefix, out) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, path, out);
    } else if (!isNoteKey(path)) {
      out.add(path);
    }
  }
  return out;
}

// Returns a Map of dotted message key -> namespace file it came from.
function inventoryFor(locale) {
  const dir = join(LOCALES_DIR, locale);
  const inventory = new Map();

  for (const entry of readdirSync(dir)) {
    if (extname(entry) !== '.json') continue;
    const namespaceFile = entry.slice(0, -'.json'.length);
    const parsed = JSON.parse(readFileSync(join(dir, entry), 'utf8'));
    for (const key of flatten(parsed, '', new Set())) {
      inventory.set(key, namespaceFile);
    }
  }

  return inventory;
}

/* -------------------------------------------------------------------------- */
/* Source scan                                                                 */
/* -------------------------------------------------------------------------- */

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(path, out);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(path);
    }
  }
  return out;
}

// Strips `as X`, `satisfies X`, parentheses and `!` so the real argument shows through.
function unwrap(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isNonNullExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function isStringLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

// `useTranslations('Ns')`, `getTranslations('Ns')` and `getTranslations({ namespace: 'Ns' })`.
function namespaceOf(call) {
  const arg = call.arguments[0];
  if (!arg) return null;
  const inner = unwrap(arg);

  if (isStringLiteral(inner)) return inner.text;

  if (ts.isObjectLiteralExpression(inner)) {
    for (const property of inner.properties) {
      if (
        ts.isPropertyAssignment(property) &&
        property.name.getText() === 'namespace'
      ) {
        const value = unwrap(property.initializer);
        if (isStringLiteral(value)) return value.text;
      }
    }
  }

  return null;
}

function awaited(node) {
  return node && ts.isAwaitExpression(node) ? node.expression : node;
}

// Returns the call node when an expression is `useTranslations(...)` or `getTranslations(...)`.
function translatorFactoryCall(node) {
  const call = unwrap(awaited(node));
  return call &&
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    TRANSLATOR_FACTORIES.has(call.expression.text)
    ? call
    : null;
}

// Returns the elements of `Promise.all([...])`, so a destructured translator can be matched by position.
function promiseAllElements(node) {
  const call = unwrap(awaited(node));
  if (!call || !ts.isCallExpression(call)) return null;
  if (call.expression.getText() !== 'Promise.all') return null;
  const list = unwrap(call.arguments[0]);
  return list && ts.isArrayLiteralExpression(list) ? list.elements : null;
}

// Follows `const t = tApple` and `const t = cond ? tApple : tGoogle` back to the translators they alias.
function aliasedNamespaces(expression, scope) {
  const node = unwrap(awaited(expression));
  if (!node) return null;

  if (ts.isIdentifier(node)) {
    return lookup(scope, node.text)?.namespaces ?? null;
  }

  if (ts.isConditionalExpression(node)) {
    const whenTrue = aliasedNamespaces(node.whenTrue, scope);
    const whenFalse = aliasedNamespaces(node.whenFalse, scope);
    return whenTrue && whenFalse ? [...whenTrue, ...whenFalse] : null;
  }

  return null;
}

// Matches `ReturnType<typeof useTranslations>` and any local alias of it.
function isTranslatorTypeNode(node, aliases) {
  if (!node) return false;
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    if (aliases.has(name)) return true;
    if (name === 'ReturnType' && node.typeArguments?.length === 1) {
      const inner = node.typeArguments[0];
      return (
        ts.isTypeQueryNode(inner) &&
        TRANSLATOR_FACTORIES.has(inner.exprName.getText())
      );
    }
  }
  return false;
}

// Collects every `i18n-used: a, b, c.*` comment in a file, keyed by line number.
function annotationsIn(text, sourceFile, file) {
  const byLine = new Map();
  for (const match of text.matchAll(ANNOTATION)) {
    const entries = match[1]
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);
    const { line } = sourceFile.getLineAndCharacterOfPosition(match.index);

    const malformed = entries.filter(entry => !ANNOTATION_ENTRY.test(entry));
    if (entries.length === 0 || malformed.length > 0) {
      errors.push(
        `${file}:${line + 1}  malformed "i18n-used:" comment. ` +
          `It takes a comma-separated key list and nothing else; put any explanation on its own line.`
      );
      continue;
    }

    byLine.set(line, [...(byLine.get(line) ?? []), ...entries]);
  }
  return byLine;
}

function annotationFor(annotations, line) {
  for (let offset = 0; offset <= ANNOTATION_LOOKBEHIND; offset++) {
    const entries = annotations.get(line - offset);
    if (entries) return { entries, line: line - offset };
  }
  return null;
}

function escapeForRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A template literal becomes a pattern: every `${...}` hole turns into `.+`.
function patternFromTemplate(node, namespace) {
  const prefix = namespace ? `${namespace}.` : '';
  let body = escapeForRegExp(prefix + node.head.text);
  for (const span of node.templateSpans) {
    body += '.+' + escapeForRegExp(span.literal.text);
  }
  return new RegExp(`^${body}$`);
}

function qualify(namespace, key) {
  return [namespace, key].filter(Boolean).join('.');
}

const used = {
  exact: new Set(), // fully resolved message keys
  patterns: [], // regexes from template literals and `*` annotations
  suffixes: new Set(), // keys from a translator passed in as an argument, namespace unknown
  namespaces: new Set(), // every namespace a component binds
};

// Annotation entries, kept so a stale one (pointing at a key that no longer exists) can be reported.
const annotationEntries = [];

// A file can declare `t` several times, once per component, each against a different namespace.
// Resolution therefore follows lexical scope rather than treating the file as one flat namespace.
function newScope(parent) {
  return {
    parent,
    // name -> { namespaces, line }. A namespace of null means the call site decides it.
    // The list holds more than one when a name aliases several translators, as in
    // `const t = wallet === 'apple_pay' ? tApple : tGoogle`.
    translators: new Map(),
    shadows: new Set(), // every name this scope declares, translator or not
  };
}

function lookup(scope, name) {
  for (let current = scope; current; current = current.parent) {
    const translator = current.translators.get(name);
    if (translator) return translator;
    if (current.shadows.has(name)) return null; // shadowed by something that is not a translator
  }
  return null;
}

// Every name a declaration introduces, so a shadowing binding hides an outer translator.
function declaredNames(name, out = []) {
  if (!name) return out;
  if (ts.isIdentifier(name)) out.push(name.text);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) declaredNames(element.name, out);
    }
  }
  return out;
}

function createsScope(node) {
  return (
    ts.isFunctionLike(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseBlock(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isCatchClause(node)
  );
}

function scanFile(file) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes('Translations')) return;

  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const lineOf = node =>
    sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;

  // Type aliases first, since a `type Translator = ...` can sit below the code that uses it.
  const aliases = new Set();
  const collectAliases = node => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      isTranslatorTypeNode(node.type, aliases)
    ) {
      aliases.add(node.name.getText());
    }
    ts.forEachChild(node, collectAliases);
  };
  collectAliases(sourceFile);

  const annotations = annotationsIn(text, sourceFile, file);

  const walk = (node, parent) => {
    const scope = createsScope(node) ? newScope(parent) : parent;

    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
      for (const name of declaredNames(node.name)) scope.shadows.add(name);
    }

    // A translator handed in as an argument: `(t: ReturnType<typeof useTranslations>) => ...`.
    // Its namespace belongs to whoever calls it, so its keys are matched by suffix instead.
    if (
      (ts.isParameter(node) || ts.isVariableDeclaration(node)) &&
      ts.isIdentifier(node.name) &&
      isTranslatorTypeNode(node.type, aliases)
    ) {
      scope.translators.set(node.name.text, {
        namespaces: [null],
        line: lineOf(node),
      });
    }

    if (
      ts.isPropertySignature(node) &&
      node.name &&
      isTranslatorTypeNode(node.type, aliases)
    ) {
      scope.translators.set(node.name.getText(), {
        namespaces: [null],
        line: lineOf(node),
      });
    }

    if (ts.isVariableDeclaration(node) && node.initializer) {
      const bindTranslator = (name, expression) => {
        const factory = translatorFactoryCall(expression);
        const namespaces = factory
          ? [namespaceOf(factory)]
          : aliasedNamespaces(expression, scope);
        if (!namespaces) return;
        scope.translators.set(name, { namespaces, line: lineOf(node) });
        for (const namespace of namespaces) {
          if (namespace) used.namespaces.add(namespace);
        }
      };

      if (ts.isIdentifier(node.name)) {
        bindTranslator(node.name.text, node.initializer);
      } else if (ts.isArrayBindingPattern(node.name)) {
        // `const [t, locale] = await Promise.all([getTranslations('Ns'), getLocale()])`
        const settled = promiseAllElements(node.initializer);
        node.name.elements.forEach((element, index) => {
          if (
            settled &&
            ts.isBindingElement(element) &&
            ts.isIdentifier(element.name)
          ) {
            bindTranslator(element.name.text, settled[index]);
          }
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      let name = null;

      if (ts.isIdentifier(callee)) {
        name = callee.text;
      } else if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        TRANSLATOR_MEMBERS.has(callee.name.text)
      ) {
        name = callee.expression.text;
      }

      const translator = name ? lookup(scope, name) : null;
      if (translator) {
        record(node, translator, sourceFile, file, annotations);
      }
    }

    ts.forEachChild(node, child => walk(child, scope));
  };

  walk(sourceFile, newScope(null));
}

function record(call, translator, sourceFile, file, annotations) {
  const { namespaces, line: declaredLine } = translator;
  const { line } = sourceFile.getLineAndCharacterOfPosition(call.getStart());
  const argument = call.arguments[0] && unwrap(call.arguments[0]);

  // Both branches of a ternary are readable, so `t(cond ? 'a' : 'b')` needs no annotation.
  const literals = [];
  const collect = node => {
    if (!node) return false;
    if (isStringLiteral(node)) {
      literals.push(node.text);
      return true;
    }
    if (ts.isConditionalExpression(node)) {
      return collect(unwrap(node.whenTrue)) && collect(unwrap(node.whenFalse));
    }
    return false;
  };

  if (collect(argument)) {
    for (const namespace of namespaces) {
      for (const key of literals) {
        if (namespace) used.exact.add(qualify(namespace, key));
        else used.suffixes.add(key);
      }
    }
    return;
  }

  if (argument && ts.isTemplateExpression(argument)) {
    for (const namespace of namespaces) {
      used.patterns.push(patternFromTemplate(argument, namespace));
    }
    return;
  }

  // The annotation can sit just above the call, or next to the translator's declaration when several
  // opaque calls in one file share the same namespace.
  const annotation =
    annotationFor(annotations, line) ??
    (declaredLine === undefined
      ? null
      : annotationFor(annotations, declaredLine));

  if (!annotation) {
    errors.push(
      `${file}:${line + 1}  key comes from a value the audit cannot read. ` +
        `Add an "i18n-used: <keys>" comment above the call, or above the translator it uses.`
    );
    return;
  }

  for (const namespace of namespaces) {
    for (const entry of annotation.entries) {
      // "*" covers every key under the bound namespace, "foo.*" every key under foo.
      if (entry.endsWith('*')) {
        const prefix = qualify(namespace, entry.replace(/\.?\*$/, ''));
        const pattern = new RegExp(
          prefix ? `^${escapeForRegExp(prefix)}\\..+$` : '^.+$'
        );
        used.patterns.push(pattern);
        annotationEntries.push({
          file,
          line: annotation.line,
          entry,
          test: key => pattern.test(key),
        });
      } else {
        const qualified = qualify(namespace, entry);
        used.exact.add(qualified);
        annotationEntries.push({
          file,
          line: annotation.line,
          entry,
          test: key => key === qualified,
        });
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

const locales = readdirSync(LOCALES_DIR).filter(name =>
  statSync(join(LOCALES_DIR, name)).isDirectory()
);

if (!locales.includes(REFERENCE_LOCALE)) {
  console.error(
    `[translations] reference locale "${REFERENCE_LOCALE}" not found in ${LOCALES_DIR}/`
  );
  process.exit(1);
}

const inventories = new Map(
  locales.map(locale => [locale, inventoryFor(locale)])
);
const reference = inventories.get(REFERENCE_LOCALE);

for (const file of sourceFiles(SOURCE_DIR)) scanFile(file);

function isUsed(key) {
  if (used.exact.has(key)) return true;
  if (used.patterns.some(pattern => pattern.test(key))) return true;
  for (const suffix of used.suffixes) {
    if (key === suffix || key.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

// 1. Namespace files nothing binds.
const boundRoots = new Set(
  [...used.namespaces].map(namespace => namespace.split('.')[0])
);
const orphanFiles = new Set();

for (const [key, namespaceFile] of reference) {
  if (DIRECT_IMPORT_FILES.has(namespaceFile)) continue;
  if (!boundRoots.has(key.split('.')[0])) orphanFiles.add(namespaceFile);
}

for (const namespaceFile of [...orphanFiles].sort()) {
  errors.push(
    `${LOCALES_DIR}/*/${namespaceFile}.json  no component binds this namespace. ` +
      `Delete it, or add it to DIRECT_IMPORT_FILES if it is read by a direct import.`
  );
}

// 2. Key-level parity between locales.
for (const [locale, inventory] of inventories) {
  if (locale === REFERENCE_LOCALE) continue;

  const missing = [...reference.keys()].filter(key => !inventory.has(key));
  const extra = [...inventory.keys()].filter(key => !reference.has(key));

  if (missing.length > 0) {
    errors.push(
      `[${locale}] missing ${missing.length} key(s) present in ${REFERENCE_LOCALE}:\n` +
        missing.map(key => `    ${key}`).join('\n')
    );
  }
  if (extra.length > 0) {
    errors.push(
      `[${locale}] has ${extra.length} key(s) absent from ${REFERENCE_LOCALE}:\n` +
        extra.map(key => `    ${key}`).join('\n')
    );
  }
}

// 3. Annotations that no longer point at a real key.
const referenceKeys = [...reference.keys()];
const reportedAnnotations = new Set();

for (const { file, line, entry, test } of annotationEntries) {
  const id = `${file}:${line}:${entry}`;
  if (reportedAnnotations.has(id)) continue;
  if (referenceKeys.some(test)) continue;
  reportedAnnotations.add(id);
  errors.push(
    `${file}:${line + 1}  "i18n-used: ${entry}" matches no key in ${LOCALES_DIR}/${REFERENCE_LOCALE}.`
  );
}

// 4. Unused keys. Advisory, so these are notes rather than errors.
const unusedByFile = new Map();
for (const [key, namespaceFile] of reference) {
  if (DIRECT_IMPORT_FILES.has(namespaceFile)) continue;
  if (orphanFiles.has(namespaceFile)) continue;
  if (isUsed(key)) continue;
  unusedByFile.set(namespaceFile, [
    ...(unusedByFile.get(namespaceFile) ?? []),
    key,
  ]);
}

const unusedCount = [...unusedByFile.values()].reduce(
  (total, keys) => total + keys.length,
  0
);

if (unusedCount > 0) {
  notes.push(
    `${unusedCount} key(s) in ${LOCALES_DIR}/${REFERENCE_LOCALE} look unused:`
  );
  for (const namespaceFile of [...unusedByFile.keys()].sort()) {
    notes.push(`  ${namespaceFile}.json`);
    for (const key of unusedByFile.get(namespaceFile).sort()) {
      notes.push(`    ${key}`);
    }
  }
}

const referenceFiles = new Set(reference.values());
for (const [namespaceFile, reason] of DIRECT_IMPORT_FILES) {
  if (referenceFiles.has(namespaceFile)) {
    notes.push(`skipped ${namespaceFile}.json — ${reason}`);
  }
}

for (const note of notes) console.log(`[translations] ${note}`);

if (errors.length > 0) {
  console.error('');
  for (const error of errors) console.error(`[translations] ${error}`);
  process.exit(1);
}

console.log(
  `[translations] checked ${reference.size} key(s) across ${locales.length} locale(s).`
);
