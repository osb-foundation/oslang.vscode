'use strict';
const assert = require('node:assert');
const a = require('../analyzer.js');

function labels(src, cursor) {
  return a.getContextCompletions(src, cursor).map(x => x.label);
}

// local var visible
{
  const src = 'VAR x\nPRINT x';
  const cur = src.indexOf('PRINT x') + 'PRINT '.length + 1; // after x? use end
  // cursor at end of 'x' in PRINT x
  const pos = src.length;
  const ls = labels(src, pos);
  assert.ok(ls.includes('X'), 'local var visible: ' + ls);
}

// function param
{
  const src = 'FUNCTION F(a, b)\n  RETURN a\nEND FUNCTION';
  const pos = src.indexOf('RETURN a') + 'RETURN '.length + 1;
  const ls = labels(src, pos);
  assert.ok(ls.includes('A') && ls.includes('B'), 'params: ' + ls);
}

// nested scope shadowing: inner y shadows outer y? both names same; inner wins but name present
{
  const src = 'VAR y\nIF TRUE THEN\n  VAR y\n  PRINT y\nEND IF';
  const pos = src.indexOf('PRINT y') + 'PRINT '.length + 1;
  const ls = labels(src, pos);
  assert.ok(ls.includes('Y'), 'shadow: ' + ls);
}

// scope boundary: var declared after cursor not visible
{
  const src = 'PRINT x\nVAR x';
  const pos = src.indexOf('PRINT x') + 'PRINT '.length; // cursor before x declared? at space after PRINT
  const ls = labels(src, pos);
  assert.ok(!ls.includes('X'), 'not visible yet: ' + ls);
}

// function suggestion
{
  const src = 'FUNCTION Foo()\nEND FUNCTION\nFoo';
  const pos = src.length;
  const ls = labels(src, pos);
  assert.ok(ls.includes('FOO'), 'function: ' + ls);
}

// malformed source no crash
{
  const src = 'FUNCTION Foo(\n  VAR x\nPRINT';
  const pos = src.length;
  const ls = labels(src, pos);
  assert.ok(Array.isArray(ls));
}

// member completion not in analyzer (extension handles); analyzer returns names only
console.log('context tests ok');
