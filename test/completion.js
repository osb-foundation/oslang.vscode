'use strict';
const assert = require('node:assert');
const d = require('../completion-data.js');
assert.ok(d.keywords.includes('FUNCTION'));
assert.ok(d.types.includes('STRING'));
assert.ok(d.stdlib.includes('COUNT'));
assert.ok(d.getCompletions('FUN').some(x=>x.label==='FUNCTION'));
assert.ok(!d.getCompletions('ZZZ').length);
console.log('completion tests ok');
