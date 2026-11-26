'use strict';
const assert = require('node:assert');
const d = require('../completion-data');
const a = require('../analyzer.js');

function off(src, afterChar) {
  // cursor right after the last occurrence of afterChar in src
  const idx = src.lastIndexOf(afterChar);
  return idx >= 0 ? idx + 1 : src.length;
}

// --- completion-data: namespaces ---
{
  const ns = d.namespaces;
  assert.ok(ns.includes('MATH'), 'MATH namespace');
  assert.ok(ns.includes('DATE'), 'DATE namespace');
  assert.ok(ns.includes('TIME'), 'TIME namespace');
  assert.ok(ns.includes('FILE'), 'FILE namespace');
  assert.ok(ns.includes('DIR'), 'DIR namespace');
  assert.ok(ns.includes('OSL'), 'OSL namespace');
  assert.ok(ns.includes('OSB'), 'OSB namespace');
  assert.ok(d.isNamespace('MATH'), 'isNamespace MATH');
  assert.ok(d.isNamespace('math'), 'isNamespace case-insensitive');
  assert.ok(!d.isNamespace('FOO'), 'isNamespace rejects unknown');
}

// --- completion-data: string members (engine StringMethods.Call) ---
{
  const m = d.stringMembers.map(x => x.label);
  assert.ok(m.includes('TOUPPER'), 'TOUPPER');
  assert.ok(m.includes('TOLOWER'), 'TOLOWER');
  assert.ok(m.includes('LENGTH'), 'LENGTH');
  assert.ok(m.includes('COUNT'), 'COUNT');
  assert.ok(m.includes('SUBSTRING'), 'SUBSTRING');
  assert.ok(m.includes('SUBSTR'), 'SUBSTR');
  assert.ok(m.includes('INDEXOF'), 'INDEXOF');
  assert.ok(m.includes('TRIM'), 'TRIM');
  assert.strictEqual(m.length, 8, 'exactly 8 string members');
}

// --- completion-data: array members (engine ArrayMethods.Call) ---
{
  const m = d.arrayMembers.map(x => x.label);
  assert.ok(m.includes('COUNT'), 'COUNT');
  assert.ok(m.includes('FIRST'), 'FIRST');
  assert.ok(m.includes('LAST'), 'LAST');
  assert.ok(m.includes('PUSH'), 'PUSH');
  assert.ok(m.includes('POP'), 'POP');
  assert.ok(m.includes('CLEAR'), 'CLEAR');
  assert.ok(m.includes('CONTAINS'), 'CONTAINS');
  assert.ok(m.includes('REMOVEAT'), 'REMOVEAT');
  assert.ok(m.includes('INSERTAT'), 'INSERTAT');
  assert.strictEqual(m.length, 9, 'exactly 9 array members');
}

// --- completion-data: namespace members ---
{
  const math = d.namespaceMembers.MATH.map(x => x.label);
  assert.ok(math.includes('PI'), 'MATH.PI');
  assert.ok(math.includes('E'), 'MATH.E');
  assert.ok(math.includes('SQRT'), 'MATH.SQRT');
  assert.ok(math.includes('ABS'), 'MATH.ABS');
  assert.ok(math.includes('POW'), 'MATH.POW');
  assert.ok(math.includes('FLOOR'), 'MATH.FLOOR');
  assert.ok(math.includes('CEIL'), 'MATH.CEIL');
  assert.ok(math.includes('ROUND'), 'MATH.ROUND');
  assert.ok(math.includes('TRUNC'), 'MATH.TRUNC');
  assert.ok(math.includes('SIN'), 'MATH.SIN');
  assert.ok(math.includes('COS'), 'MATH.COS');
  assert.ok(math.includes('TAN'), 'MATH.TAN');
  assert.ok(math.includes('ASIN'), 'MATH.ASIN');
  assert.ok(math.includes('ACOS'), 'MATH.ACOS');
  assert.ok(math.includes('ATAN'), 'MATH.ATAN');
  assert.ok(math.includes('LOG'), 'MATH.LOG');
  assert.ok(math.includes('LOG10'), 'MATH.LOG10');
  assert.ok(math.includes('EXP'), 'MATH.EXP');
  assert.ok(math.includes('SIGN'), 'MATH.SIGN');
  assert.ok(math.includes('MIN'), 'MATH.MIN');
  assert.ok(math.includes('MAX'), 'MATH.MAX');
  assert.ok(math.includes('CLAMP'), 'MATH.CLAMP');
  assert.ok(math.includes('MOD'), 'MATH.MOD');
  assert.ok(math.includes('RANDOM'), 'MATH.RANDOM');

  const date = d.namespaceMembers.DATE.map(x => x.label);
  assert.ok(date.includes('NOW'), 'DATE.NOW');
  assert.ok(date.includes('YEAR'), 'DATE.YEAR');
  assert.ok(date.includes('MONTH'), 'DATE.MONTH');
  assert.ok(date.includes('DAY'), 'DATE.DAY');
  assert.ok(date.includes('DAYOFWEEK'), 'DATE.DAYOFWEEK');

  const time = d.namespaceMembers.TIME.map(x => x.label);
  assert.ok(time.includes('NOW'), 'TIME.NOW');
  assert.ok(time.includes('HOUR'), 'TIME.HOUR');
  assert.ok(time.includes('MINUTE'), 'TIME.MINUTE');
  assert.ok(time.includes('SECOND'), 'TIME.SECOND');
}

// --- completion-data: signatures ---
{
  assert.deepStrictEqual(d.getStdlibSignature('STR'), [{ label: 'value' }]);
  assert.deepStrictEqual(d.getStdlibSignature('NUMBER'), [{ label: 'value' }]);
  assert.deepStrictEqual(d.getStdlibSignature('BOOL'), [{ label: 'value' }]);
  assert.deepStrictEqual(d.getStdlibSignature('LEFT'), [{ label: 's' }, { label: 'n' }]);
  assert.ok(!d.getStdlibSignature('UNKNOWN'), 'unknown stdlib -> null');

  assert.deepStrictEqual(d.getNamespaceSignature('MATH', 'PI'), []);
  assert.deepStrictEqual(d.getNamespaceSignature('MATH', 'SQRT'), [{ label: 'x' }]);
  assert.deepStrictEqual(d.getNamespaceSignature('MATH', 'POW'), [{ label: 'x' }, { label: 'y' }]);
  assert.deepStrictEqual(d.getNamespaceSignature('MATH', 'CLAMP'), [{ label: 'x' }, { label: 'min' }, { label: 'max' }]);
  assert.deepStrictEqual(d.getNamespaceSignature('MATH', 'RANDOM'), []);
  assert.deepStrictEqual(d.getNamespaceSignature('DATE', 'YEAR'), [{ label: 'days' }]);
  assert.deepStrictEqual(d.getNamespaceSignature('TIME', 'HOUR'), [{ label: 'millis' }]);
  assert.ok(!d.getNamespaceSignature('MATH', 'UNKNOWN'), 'unknown method -> null');
  assert.ok(!d.getNamespaceSignature('UNKNOWN', 'FOO'), 'unknown ns -> null');
}

// --- analyzer: getReceiverType ---
{
  assert.strictEqual(a.getReceiverType('MATH.', off('MATH.', '.')), 'NAMESPACE:MATH', 'MATH dot');
  assert.strictEqual(a.getReceiverType('DATE.', off('DATE.', '.')), 'NAMESPACE:DATE', 'DATE dot');
  assert.strictEqual(a.getReceiverType('TIME.', off('TIME.', '.')), 'NAMESPACE:TIME', 'TIME dot');
  assert.strictEqual(a.getReceiverType('"hello".', off('"hello".', '.')), 'STRING', 'string literal dot');
  assert.strictEqual(a.getReceiverType('42.', off('42.', '.')), 'NUMBER', 'number literal dot');
  assert.strictEqual(a.getReceiverType('TRUE.', off('TRUE.', '.')), 'BOOLEAN', 'TRUE dot');
  assert.strictEqual(a.getReceiverType('FALSE.', off('FALSE.', '.')), 'BOOLEAN', 'FALSE dot');
  assert.strictEqual(a.getReceiverType('VAR s STRING\ns.', off('VAR s STRING\ns.', '.')), 'STRING', 'typed string var');
  assert.strictEqual(a.getReceiverType('VAR n NUMBER\nn.', off('VAR n NUMBER\nn.', '.')), 'NUMBER', 'typed number var');
  assert.strictEqual(a.getReceiverType('MATH', 4), null, 'no dot');
  assert.strictEqual(a.getReceiverType('PRINT x', 7), null, 'no dot in line');
}

// --- analyzer: getMemberCompletions / getAllMembers ---
{
  const math = a.getMemberCompletions('MATH.', off('MATH.', '.')).map(x => x.label);
  assert.ok(math.includes('SQRT'), 'MATH.SQRT member');
  assert.ok(math.includes('PI'), 'MATH.PI member');
  assert.ok(math.includes('RANDOM'), 'MATH.RANDOM member');

  const str = a.getMemberCompletions('VAR s STRING\ns.', off('VAR s STRING\ns.', '.')).map(x => x.label);
  assert.ok(str.includes('TOUPPER'), 'string TOUPPER');
  assert.ok(str.includes('TOLOWER'), 'string TOLOWER');
  assert.ok(str.includes('LENGTH'), 'string LENGTH');
  assert.ok(str.includes('COUNT'), 'string COUNT');
  assert.ok(str.includes('SUBSTRING'), 'string SUBSTRING');
  assert.ok(str.includes('SUBSTR'), 'string SUBSTR');
  assert.ok(str.includes('INDEXOF'), 'string INDEXOF');
  assert.ok(str.includes('TRIM'), 'string TRIM');

  const arr = a.getMemberCompletions('VAR arr ARRAY\narr.', off('VAR arr ARRAY\narr.', '.')).map(x => x.label);
  assert.ok(arr.includes('COUNT'), 'array COUNT');
  assert.ok(arr.includes('FIRST'), 'array FIRST');
  assert.ok(arr.includes('LAST'), 'array LAST');
  assert.ok(arr.includes('PUSH'), 'array PUSH');
  assert.ok(arr.includes('POP'), 'array POP');
  assert.ok(arr.includes('CLEAR'), 'array CLEAR');
  assert.ok(arr.includes('CONTAINS'), 'array CONTAINS');
  assert.ok(arr.includes('REMOVEAT'), 'array REMOVEAT');
  assert.ok(arr.includes('INSERTAT'), 'array INSERTAT');

  assert.deepStrictEqual(a.getMemberCompletions('VAR x\nx.', off('VAR x\nx.', '.')), [], 'unknown type -> empty');
  assert.deepStrictEqual(a.getMemberCompletions('MATH', 4), [], 'no dot -> empty');
}

// --- analyzer: getContextCompletions with prefix after dot ---
{
  const filtered = a.getContextCompletions('MATH.S', 6);
  const labels = filtered.map(x => x.label);
  assert.ok(labels.includes('SQRT'), 'filtered SQRT');
  assert.ok(labels.includes('SIN'), 'filtered SIN');
  assert.ok(labels.includes('SIGN'), 'filtered SIGN');
  assert.ok(!labels.includes('PI'), 'PI excluded by prefix S');
  assert.ok(!labels.includes('ABS'), 'ABS excluded by prefix S');

  const all = a.getContextCompletions('MATH.', off('MATH.', '.'));
  assert.ok(all.some(x => x.label === 'PI'), 'MATH. includes PI');
  assert.ok(all.some(x => x.label === 'SQRT'), 'MATH. includes SQRT');

  const symbols = a.getContextCompletions('VAR x\nx', 7);
  assert.ok(symbols.some(x => x.label === 'X'), 'visible var X');
}

// --- analyzer: getSignatureHelp ---
{
  const src = 'FUNCTION Add(a, b)\n  RETURN a + b\nEND FUNCTION\nAdd(';
  const res = a.getSignatureHelp(src, src.length);
  assert.ok(res, 'signature help for user function');
    assert.strictEqual(res.signatures[0].label, 'ADD(A, B)');
  assert.strictEqual(res.activeParameter, 0);

  {
    const res = a.getSignatureHelp('STR(', 4);
    assert.ok(res, 'signature help for STR');
    assert.strictEqual(res.signatures[0].label, 'STR(value)');
    assert.strictEqual(res.activeParameter, 0);
  }

  {
    const res = a.getSignatureHelp('LEFT(s, ', 9);
    assert.ok(res, 'signature help for LEFT');
    assert.strictEqual(res.signatures[0].label, 'LEFT(s, n)');
    assert.strictEqual(res.activeParameter, 1);
  }

  {
    const res = a.getSignatureHelp('MATH.SQRT(', 10);
    assert.ok(res, 'signature help for MATH.SQRT');
    assert.strictEqual(res.signatures[0].label, 'MATH.SQRT(x)');
    assert.strictEqual(res.activeParameter, 0);
  }

  {
    const res = a.getSignatureHelp('MATH.POW(x, ', 12);
    assert.ok(res, 'signature help for MATH.POW');
    assert.strictEqual(res.signatures[0].label, 'MATH.POW(x, y)');
    assert.strictEqual(res.activeParameter, 1);
  }

  {
    const src = 'MATH.CLAMP(x, min, ';
    const res = a.getSignatureHelp(src, src.length);
    assert.ok(res, 'signature help for MATH.CLAMP');
    assert.strictEqual(res.signatures[0].label, 'MATH.CLAMP(x, min, max)');
    assert.strictEqual(res.activeParameter, 2);
  }

  {
    const src = 'FUNCTION Foo(a, b)\nEND FUNCTION\nFoo(bar(a, b), c)';
    const cursor = src.indexOf('c)') + 1;
    const res = a.getSignatureHelp(src, cursor);
    assert.ok(res, 'signature help with nested call');
    assert.strictEqual(res.signatures[0].label, 'FOO(A, B)');
    assert.strictEqual(res.activeParameter, 1, 'active param = 1 (second param), comma inside bar() not counted');
  }

  assert.ok(!a.getSignatureHelp('UNKNOWNFOO(', 13), 'unknown function -> null');
  assert.ok(!a.getSignatureHelp('PRINT x', 7), 'no paren -> null');
}

console.log('member & signature tests ok');
