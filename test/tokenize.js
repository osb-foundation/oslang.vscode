// OSLANG 0.8 TextMate grammar tokenization tests.
//
// Exercises the actual TextMate grammar (syntaxes/oslang.tmLanguage.json)
// through the real vscode-textmate / vscode-oniguruma tokenization pipeline.
// Simple source-text searches are deliberately NOT used as a substitute.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');

const oniguruma = require('vscode-oniguruma');
const { Registry } = require('vscode-textmate');

const ROOT = path.dirname(__dirname);
const GRAMMAR_PATH = path.join(ROOT, 'syntaxes', 'oslang.tmLanguage.json');
const FIXTURES_DIR = path.join(ROOT, 'test', 'fixtures');

let passed = 0;
let failed = 0;

function ok(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`ok  - ${name}\n`);
  } catch (err) {
    failed++;
    process.stdout.write(`not ok - ${name}\n       ${err.message}\n`);
  }
}

function assertToken(tokens, line, text, expectedScope) {
  const token = tokens.find((t) => t.line === line && t.text === text);
  if (!token) {
    throw new Error(`line ${line}: expected token ${JSON.stringify(text)} not found`);
  }
  if (!token.scopes.includes(expectedScope)) {
    throw new Error(
      `line ${line}: token ${JSON.stringify(text)} has scopes ${JSON.stringify(
        token.scopes
      )}, expected to include ${expectedScope}`
    );
  }
}

function tokenizeFile(grammar, text) {
  const lines = text.split('\n');
  const tokens = [];
  let ruleStack;
  for (let i = 0; i < lines.length; i++) {
    const result = grammar.tokenizeLine(lines[i], ruleStack);
    ruleStack = result.ruleStack;
    for (const t of result.tokens) {
      tokens.push({
        line: i + 1,
        start: t.startIndex,
        end: t.endIndex,
        text: lines[i].slice(t.startIndex, t.endIndex),
        scopes: t.scopes,
      });
    }
  }
  return tokens;
}

async function main() {
  const wasmPath = path.join(
    ROOT,
    'node_modules',
    'vscode-oniguruma',
    'release',
    'onig.wasm'
  );
  const wasm = fs.readFileSync(wasmPath);
  await oniguruma.loadWASM({ data: wasm });

  const onigLib = {
    createOnigScanner: (sources) => oniguruma.createOnigScanner(sources),
    createOnigString: (s) => oniguruma.createOnigString(s),
  };

  const registry = new Registry({
    onigLib: Promise.resolve(onigLib),
    loadGrammar: async (scopeName) => {
      if (scopeName !== 'source.oslang') return null;
      return JSON.parse(fs.readFileSync(GRAMMAR_PATH, 'utf8'));
    },
  });

  const grammar = await registry.loadGrammar('source.oslang');
  if (!grammar) throw new Error('grammar source.oslang failed to load');

  const fixtureNames = fs.readdirSync(FIXTURES_DIR).filter((n) => n.endsWith('.osl'));

  for (const name of fixtureNames) {
    const text = fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
    ok(`${name}: tokenizes without throwing`, () => {
      tokenizeFile(grammar, text);
    });
    ok(`${name}: tokenizer produces text coverage`, () => {
      const tokens = tokenizeFile(grammar, text);
      let covered = 0;
      for (const t of tokens) covered += t.end - t.start;
      assert.ok(covered > 0);
    });
  }

  const fixtureText = fs.readFileSync(
    path.join(FIXTURES_DIR, 'comprehensive.osl'),
    'utf8'
  );
  const c = tokenizeFile(grammar, fixtureText);

  function lineOf(marker) {
    const lines = fixtureText.split('\n');
    const want = marker.trim();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === want) return i + 1;
    }
    throw new Error('fixture line not found: ' + marker);
  }

  function findToken(text) {
    return c.find((t) => t.text === text);
  }

  // --- declarations ---
  ok('FUNCTION keyword -> keyword.declaration', () =>
    assertToken(c, lineOf('FUNCTION Add(a, b)'), 'FUNCTION', 'keyword.declaration.oslang')
  );
  ok('VAR keyword -> keyword.declaration', () =>
    assertToken(c, lineOf('VAR myCount'), 'VAR', 'keyword.declaration.oslang')
  );
  ok('CLASS keyword -> keyword.declaration', () =>
    assertToken(c, lineOf('CLASS Point'), 'CLASS', 'keyword.declaration.oslang')
  );
  ok('CONSTRUCTOR keyword -> keyword.declaration', () =>
    assertToken(
      c,
      lineOf('CONSTRUCTOR(x, y)'),
      'CONSTRUCTOR',
      'keyword.declaration.oslang'
    )
  );
  ok('ENUM keyword -> keyword.declaration', () =>
    assertToken(c, lineOf('ENUM Color'), 'ENUM', 'keyword.declaration.oslang')
  );
  ok('USING keyword -> keyword.declaration', () =>
    assertToken(c, lineOf('USING OSL.CONSOLE'), 'USING', 'keyword.declaration.oslang')
  );

  // --- control flow ---
  ok('IF keyword -> keyword.control', () =>
    assertToken(c, lineOf('IF myCount > 0 THEN'), 'IF', 'keyword.control.oslang')
  );
  ok('THEN keyword -> keyword.control', () =>
    assertToken(c, lineOf('IF myCount > 0 THEN'), 'THEN', 'keyword.control.oslang')
  );
  ok('ELIF keyword -> keyword.control', () =>
    assertToken(c, lineOf('ELIF myCount < 0 THEN'), 'ELIF', 'keyword.control.oslang')
  );
  ok('ELSE keyword -> keyword.control', () =>
    assertToken(c, lineOf('ELSE'), 'ELSE', 'keyword.control.oslang')
  );
  ok('END keyword -> keyword.control', () =>
    assertToken(c, lineOf('END'), 'END', 'keyword.control.oslang')
  );
  ok('FOR keyword -> keyword.control', () =>
    assertToken(c, lineOf('FOR i = 1 TO 10 STEP 1'), 'FOR', 'keyword.control.oslang')
  );
  ok('TO keyword -> keyword.control', () =>
    assertToken(
      c,
      lineOf('FOR i = 1 TO 10 STEP 1'),
      'TO',
      'keyword.control.oslang'
    )
  );
  ok('STEP keyword -> keyword.control', () =>
    assertToken(
      c,
      lineOf('FOR i = 1 TO 10 STEP 1'),
      'STEP',
      'keyword.control.oslang'
    )
  );
  ok('WHILE keyword -> keyword.control', () =>
    assertToken(c, lineOf('WHILE myCount > 0'), 'WHILE', 'keyword.control.oslang')
  );
  ok('DO keyword -> keyword.control', () =>
    assertToken(c, lineOf('DO'), 'DO', 'keyword.control.oslang')
  );
  ok('SWITCH keyword -> keyword.control', () =>
    assertToken(c, lineOf('SWITCH day'), 'SWITCH', 'keyword.control.oslang')
  );
  ok('CASE keyword -> keyword.control', () =>
    assertToken(c, lineOf('CASE 1'), 'CASE', 'keyword.control.oslang')
  );
  ok('DEFAULT keyword -> keyword.control', () =>
    assertToken(c, lineOf('DEFAULT'), 'DEFAULT', 'keyword.control.oslang')
  );
  ok('TRY keyword -> keyword.control', () =>
    assertToken(c, lineOf('TRY'), 'TRY', 'keyword.control.oslang')
  );
  ok('CATCH keyword -> keyword.control', () =>
    assertToken(c, lineOf('CATCH err'), 'CATCH', 'keyword.control.oslang')
  );
  ok('RETURN keyword -> keyword.control', () =>
    assertToken(c, lineOf('RETURN a + b'), 'RETURN', 'keyword.control.oslang')
  );
  ok('AND keyword -> keyword.control', () =>
    assertToken(c, lineOf('valid = flag AND NOT empty'), 'AND', 'keyword.control.oslang')
  );
  ok('NOT keyword -> keyword.control', () =>
    assertToken(
      c,
      lineOf('valid = flag AND NOT empty'),
      'NOT',
      'keyword.control.oslang'
    )
  );
  ok('RAISE keyword -> keyword.control', () => {
    const t = findToken('RAISE');
    if (!t) throw new Error('RAISE token not found (not present in fixture)');
    assert.ok(t.scopes.includes('keyword.control.oslang'));
  });

  // --- other keywords ---
  ok('PRINT keyword -> keyword.other', () =>
    assertToken(c, lineOf('PRINT "positive"'), 'PRINT', 'keyword.other.oslang')
  );
  ok('MATH keyword -> keyword.other', () =>
    assertToken(c, lineOf('MATH.SQRT(16)'), 'MATH', 'keyword.other.oslang')
  );
  ok('OSL keyword -> keyword.other', () =>
    assertToken(c, lineOf('OSL.CONSOLE.WRITE("hello")'), 'OSL', 'keyword.other.oslang')
  );
  ok('STR keyword -> keyword.other', () =>
    assertToken(c, lineOf('STR(x)'), 'STR', 'keyword.other.oslang')
  );
  ok('BASE keyword -> keyword.other', () =>
    assertToken(c, lineOf('BASE()'), 'BASE', 'keyword.other.oslang')
  );
  ok('TYPEOF keyword -> keyword.other', () =>
    assertToken(c, lineOf('TYPEOF(x)'), 'TYPEOF', 'keyword.other.oslang')
  );

  // --- modifiers ---
  ok('PUBLIC modifier -> storage.modifier', () =>
    assertToken(c, lineOf('PUBLIC X'), 'PUBLIC', 'storage.modifier.oslang')
  );
  ok('PRIVATE modifier -> storage.modifier', () =>
    assertToken(c, lineOf('PRIVATE Y'), 'PRIVATE', 'storage.modifier.oslang')
  );
  ok('VIRTUAL modifier -> storage.modifier', () =>
    assertToken(c, lineOf('VIRTUAL'), 'VIRTUAL', 'storage.modifier.oslang')
  );
  ok('OVERRIDE modifier -> storage.modifier', () =>
    assertToken(c, lineOf('OVERRIDE'), 'OVERRIDE', 'storage.modifier.oslang')
  );

  // --- constants ---
  ok('TRUE -> constant.language', () =>
    assertToken(c, lineOf('flag = TRUE'), 'TRUE', 'constant.language.oslang')
  );
  ok('FALSE -> constant.language', () =>
    assertToken(c, lineOf('WHILE FALSE'), 'FALSE', 'constant.language.oslang')
  );
  ok('NULL -> constant.language', () =>
    assertToken(c, lineOf('empty = NULL'), 'NULL', 'constant.language.oslang')
  );

  // --- types ---
  ok('NUMBER type -> storage.type', () =>
    assertToken(c, lineOf('VAR age NUMBER'), 'NUMBER', 'storage.type.oslang')
  );
  ok('STRING type -> storage.type', () =>
    assertToken(c, lineOf('VAR name STRING'), 'STRING', 'storage.type.oslang')
  );

  // --- numeric literals ---
  ok('integer literal -> constant.numeric.number', () =>
    assertToken(c, lineOf('myCount = 42'), '42', 'constant.numeric.number.oslang')
  );
  ok('float literal -> constant.numeric.number', () =>
    assertToken(c, lineOf('pi = 3.14'), '3.14', 'constant.numeric.number.oslang')
  );
  ok('date literal -> constant.numeric.date', () =>
    assertToken(
      c,
      lineOf('today = #2026-11-26#'),
      '#2026-11-26#',
      'constant.numeric.date.oslang'
    )
  );
  ok('time literal -> constant.numeric.time', () =>
    assertToken(
      c,
      lineOf('now = #14:30:45#'),
      '#14:30:45#',
      'constant.numeric.time.oslang'
    )
  );

  // --- strings and escapes ---
  ok('double-quoted string -> string.quoted.double', () =>
    assertToken(
      c,
      lineOf('message = "Hello, OSLANG!"'),
      'Hello, OSLANG!',
      'string.quoted.double.oslang'
    )
  );
  ok('escaped doubled quote "" -> constant.character.escape', () => {
    const token = findToken('""');
    assert.ok(token, 'doubled-quote escape token not found');
    assert.ok(token.scopes.includes('constant.character.escape.oslang'));
  });
  ok('backslash-n escape -> constant.character.escape', () => {
    const token = findToken('\\n');
    assert.ok(token, 'backslash-n escape token not found');
    assert.ok(token.scopes.includes('constant.character.escape.oslang'));
  });

  // --- comments ---
  ok("apostrophe line comment -> comment.line.apostrophe", () => {
    const lines = fixtureText.split('\n');
    const t = c.find((tk) => tk.line === 2 && tk.scopes.includes('comment.line.apostrophe.oslang'));
    assert.ok(t, 'apostrophe comment token not found on line 2');
    assert.ok(t.text.startsWith("'"));
  });
  ok('REM line comment -> comment.line.rem', () => {
    const line = lineOf('REM OSLANG 0.8 comprehensive lexical fixture');
    const t = c.find((tk) => tk.line === line && tk.text.startsWith('REM'));
    assert.ok(t, 'REM comment token not found');
    assert.ok(t.scopes.includes('comment.line.rem.oslang'));
  });
  ok('block comment -> comment.block', () => {
    const line = lineOf('/* Block comment');
    const t = c.find((tk) => tk.line === line && tk.scopes.includes('comment.block.oslang'));
    assert.ok(t, 'block comment token not found');
    assert.ok(t.text.startsWith('/*'));
  });

  // --- operators ---
  ok('+ operator -> keyword.operator.arithmetic', () => {
    const t = c.find((tk) => tk.line === lineOf('RETURN a + b') && tk.text === '+');
    assert.ok(t, 'plus operator token not found');
    assert.ok(t.scopes.includes('keyword.operator.arithmetic.oslang'));
  });
  ok('- operator -> keyword.operator.arithmetic', () => {
    const t = c.find((tk) => tk.line === lineOf('myCount = myCount - 1') && tk.text === '-');
    assert.ok(t, 'minus operator token not found');
    assert.ok(t.scopes.includes('keyword.operator.arithmetic.oslang'));
  });
  ok('** operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('power = 2 ** 8'), '**', 'keyword.operator.arithmetic.oslang')
  );
  ok('++ operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('counter++'), '++', 'keyword.operator.arithmetic.oslang')
  );
  ok('-- operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('counter--'), '--', 'keyword.operator.arithmetic.oslang')
  );
  ok('+= operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('total += 5'), '+=', 'keyword.operator.arithmetic.oslang')
  );
  ok('% operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('mod = 10 % 3'), '%', 'keyword.operator.arithmetic.oslang')
  );
  ok('MOD operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('rem = 10 MOD 3'), 'MOD', 'keyword.operator.arithmetic.oslang')
  );
  ok('| pipe operator -> keyword.operator.arithmetic', () =>
    assertToken(c, lineOf('combined = Color.RED | Color.GREEN'), '|', 'keyword.operator.arithmetic.oslang')
  );
  ok('=> operator -> keyword.operator.arrow', () =>
    assertToken(c, lineOf('arrow = a => b'), '=>', 'keyword.operator.arrow.oslang')
  );
  ok('-> operator -> keyword.operator.arrow', () =>
    assertToken(c, lineOf('other = c -> d'), '->', 'keyword.operator.arrow.oslang')
  );
  ok('> comparison -> keyword.operator.comparison', () => {
    const t = c.find(
      (tk) => tk.line === lineOf('IF myCount > 0 THEN') && tk.text === '>'
    );
    assert.ok(t, 'comparison operator token not found');
    assert.ok(t.scopes.includes('keyword.operator.comparison.oslang'));
  });

  // --- punctuation ---
  ok('. punctuation -> punctuation', () => {
    const t = c.find((tk) => tk.line === lineOf('OSL.CONSOLE.WRITE("hello")') && tk.text === '.');
    assert.ok(t, 'dot punctuation token not found');
    assert.ok(t.scopes.includes('punctuation.oslang'));
  });
  ok('( ) punctuation -> punctuation', () => {
    const t = c.find((tk) => tk.line === lineOf('FUNCTION Add(a, b)') && tk.text === '(');
    assert.ok(t, 'paren punctuation token not found');
    assert.ok(t.scopes.includes('punctuation.oslang'));
  });

  // --- identifiers ---
  ok('identifier -> variable.other.identifier', () =>
    assertToken(c, lineOf('VAR myCount'), 'myCount', 'variable.other.identifier.oslang')
  );
  ok('namespace member CONSOLE -> identifier', () => {
    const t = c.find((tk) => tk.line === lineOf('USING OSL.CONSOLE') && tk.text === 'CONSOLE');
    assert.ok(t, 'CONSOLE identifier token not found');
    assert.ok(t.scopes.includes('variable.other.identifier.oslang'));
  });

  // --- negative: keyword text inside identifiers must not be classified as keywords ---
  ok('FUNCTIONAL is identifier, not keyword', () => {
    const t = c.find((tk) => tk.line === lineOf('FUNCTIONAL = 1') && tk.text === 'FUNCTIONAL');
    assert.ok(t, 'FUNCTIONAL token not found');
    assert.ok(t.scopes.includes('variable.other.identifier.oslang'));
    assert.ok(!t.scopes.includes('keyword.declaration.oslang'));
  });
  ok('NOTHING is identifier, not keyword (contains NOT)', () => {
    const t = c.find((tk) => tk.line === lineOf('NOTHING = 2') && tk.text === 'NOTHING');
    assert.ok(t, 'NOTHING token not found');
    assert.ok(t.scopes.includes('variable.other.identifier.oslang'));
    assert.ok(!t.scopes.includes('keyword.control.oslang'));
  });
  ok('COUNTDOWN is identifier, not keyword (contains COUNT)', () => {
    const t = c.find((tk) => tk.line === lineOf('COUNTDOWN = 3') && tk.text === 'COUNTDOWN');
    assert.ok(t, 'COUNTDOWN token not found');
    assert.ok(t.scopes.includes('variable.other.identifier.oslang'));
  });

  // --- negative: keywords inside strings and comments are not classified as keywords ---
  ok('FUNCTION inside string is string content, not keyword', () => {
    const line = lineOf('STRING_WITH_KEYWORD = "FUNCTION THEN END NOTHING COUNT"');
    const t = c.find((tk) => tk.line === line && tk.text.startsWith('FUNCTION'));
    assert.ok(t, 'string-with-keywords token not found');
    assert.ok(t.scopes.includes('string.quoted.double.oslang'));
    assert.ok(!t.scopes.includes('keyword.declaration.oslang'));
  });
  ok('keywords inside line comment are comment content', () => {
    const line = lineOf("' KEYWORDS_IN_COMMENT: WHILE DO SWITCH CASE DEFAULT TRY CATCH RAISE ON");
    const t = c.find((tk) => tk.line === line && tk.scopes.includes('comment.line.apostrophe.oslang'));
    assert.ok(t, 'line comment token not found');
    assert.ok(!t.scopes.some((s) => s.includes('keyword')));
  });
  ok('FUNCTION inside block comment is comment content', () => {
    const t = c.find(
      (tk) =>
        tk.line >= lineOf('/* Block comment') &&
        tk.line <= lineOf('   with IF FUNCTION END inside */') &&
        tk.text.includes('FUNCTION') &&
        tk.scopes.includes('comment.block.oslang')
    );
    assert.ok(t, 'FUNCTION inside block comment not found as comment');
  });

  // --- unsupported syntax: string interpolation ${} is not in the OSLANG 0.8 spec ---
  const interpTokens = tokenizeFile(grammar, 'PRICE = "price: ${x}"\n${name}\n');
  ok('${} interpolation inside string stays string content', () => {
    const t = interpTokens.find((tk) => tk.line === 1 && tk.text.startsWith('price:'));
    assert.ok(t, 'interpolated string token not found');
    assert.ok(t.scopes.includes('string.quoted.double.oslang'));
    assert.ok(!t.scopes.some((s) => s.includes('interpolation')));
  });
  ok('${} outside string receives no interpolation scope', () => {
    const dollar = interpTokens.find((tk) => tk.line === 2 && tk.text === '${');
    if (dollar) {
      assert.ok(!dollar.scopes.some((s) => s.includes('interpolation')));
    }
  });

  // --- real project example: hello.osl ---
  const helloText = fs.readFileSync(path.join(FIXTURES_DIR, 'hello.osl'), 'utf8');
  const hello = tokenizeFile(grammar, helloText);
  ok('hello.osl: FUNCTION scoped as declaration', () =>
    assertToken(hello, 3, 'FUNCTION', 'keyword.declaration.oslang')
  );
  ok('hello.osl: PRINT scoped as keyword.other', () =>
    assertToken(hello, 4, 'PRINT', 'keyword.other.oslang')
  );
  ok('hello.osl: string scoped', () =>
    assertToken(hello, 4, 'Hello from OSLANG!', 'string.quoted.double.oslang')
  );

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
