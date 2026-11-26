'use strict';

const keywords = [
  'AND','BREAK','CATCH','CONTINUE','DO','ELIF','ELSE','END','FOR','IF','NOT','OR','RETURN','STEP','THEN','TO','WHILE','TRY','SWITCH','CASE','DEFAULT','RAISE','ON',
  'CONSTRUCTOR','FUNCTION','CLASS','INTERFACE','VAR','GLOBAL','USING','EVENT','ENUM',
  'PUBLIC','PRIVATE','PROTECTED','VIRTUAL','OVERRIDE',
  'BASE','ME','NEW','PRINT','INPUT','CLEAR','SHOW','MATH','FILE','DIR','DATE','TIME','TYPEOF','STR','SQRT','POW','FLOOR','CEIL','COUNT','OSL','OSB','IN','EACH',
  'TRUE','FALSE','NULL'
];

const types = ['BOOLEAN','BOOL','NUMBER','STRING','OBJECT'];

const stdlib = [
  'STR','NUMBER','BOOL','COUNT','TYPEOF','LEFT','RIGHT','INSERT','REMOVE','REPEAT','TOUPPER','TOLOWER','TRIM','DATE','TIME'
];

const constructs = [
  'FUNCTION ${1:name}(${2:params})\n  ${3}\nEND FUNCTION',
  'IF ${1:condition} THEN\n  ${2}\nEND IF',
  'FOR ${1:i} = ${2:0} TO ${3:10}\n  ${4}\nNEXT',
  'WHILE ${1:condition}\n  ${2}\nEND WHILE',
  'CLASS ${1:Name}\n  ${2}\nEND CLASS',
  'TRY\n  ${1}\nCATCH ${2:e}\n  ${3}\nEND TRY',
  'SWITCH ${1:expr}\n  CASE ${2}:\n    ${3}\n  DEFAULT:\n    ${4}\nEND SWITCH'
];

function makeCompletion(label, kind, detail, insertText, snippet) {
  return { label, kind, detail, insertText, snippet };
}

function getCompletions(prefix) {
  const p = (prefix || '').toUpperCase();
  const items = [];
  for (const k of keywords) {
    if (!p || k.startsWith(p)) items.push(makeCompletion(k, 'keyword', 'OSLANG keyword', k, false));
  }
  for (const t of types) {
    if (!p || t.startsWith(p)) items.push(makeCompletion(t, 'type', 'OSLANG type', t, false));
  }
  for (const f of stdlib) {
    if (!p || f.startsWith(p)) items.push(makeCompletion(f, 'function', 'OSLANG standard library', f + '()', false));
  }
  for (const c of constructs) {
    const label = c.split(' ')[0] + ' snippet';
    if (!p || label.toUpperCase().startsWith(p)) items.push(makeCompletion(label, 'snippet', 'OSLANG construct', c, true));
  }
  return items;
}

module.exports = { keywords, types, stdlib, constructs, getCompletions };
