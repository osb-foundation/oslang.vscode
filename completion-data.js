'use strict';

const keywords = [
  'AND','BREAK','CATCH','CONTINUE','DO','ELIF','ELSE','END','FOR','IF','NOT','OR','RETURN','STEP','THEN','TO','WHILE','TRY','SWITCH','CASE','DEFAULT','RAISE','ON',
  'CONSTRUCTOR','FUNCTION','CLASS','INTERFACE','VAR','GLOBAL','USING','EVENT','ENUM',
  'PUBLIC','PRIVATE','PROTECTED','VIRTUAL','OVERRIDE',
  'BASE','ME','NEW','PRINT','INPUT','CLEAR','SHOW','MATH','FILE','DIR','DATE','TIME','TYPEOF','STR','SQRT','POW','FLOOR','CEIL','COUNT','OSL','OSB','IN','EACH',
  'TRUE','FALSE','NULL'
];

const types = ['BOOLEAN','BOOL','NUMBER','STRING','OBJECT','ARRAY'];

// Namespace names (OSLANG 0.4-0.6): recognized as receiver for member completion
const namespaces = ['MATH','DATE','TIME','FILE','DIR','OSL','OSB'];

// Global stdlib functions (OSLANG 0.6 StandardLibrary.TryCall)
const stdlib = [
  'STR','NUMBER','BOOL','COUNT','TYPEOF','LEFT','RIGHT','INSERT','REMOVE','REPEAT','TOUPPER','TOLOWER','TRIM','DATE','TIME'
];

// String members (engine/Core/Eval/StringMethods.Call): TOUPPER, TOLOWER, LENGTH/COUNT, SUBSTRING/SUBSTR, INDEXOF, TRIM
const stringMembers = [
  { label: 'TOUPPER', kind: 'function', detail: 'String method', insertText: 'TOUPPER()', snippet: true },
  { label: 'TOLOWER', kind: 'function', detail: 'String method', insertText: 'TOLOWER()', snippet: true },
  { label: 'LENGTH', kind: 'variable', detail: 'String property (code points)', insertText: 'LENGTH', snippet: false },
  { label: 'COUNT', kind: 'variable', detail: 'String property (code points)', insertText: 'COUNT', snippet: false },
  { label: 'SUBSTRING', kind: 'function', detail: 'String method (start, length?)', insertText: 'SUBSTRING(${1:start}, ${2:length})', snippet: true },
  { label: 'SUBSTR', kind: 'function', detail: 'String method (start, length?)', insertText: 'SUBSTR(${1:start}, ${2:length})', snippet: true },
  { label: 'INDEXOF', kind: 'function', detail: 'String method (needle)', insertText: 'INDEXOF(${1:needle})', snippet: true },
  { label: 'TRIM', kind: 'function', detail: 'String method', insertText: 'TRIM()', snippet: true },
];

// Array members (engine/Core/Eval/ArrayMethods.Call): COUNT, FIRST, LAST, PUSH, POP, CLEAR, CONTAINS, REMOVEAT, INSERTAT
const arrayMembers = [
  { label: 'COUNT', kind: 'variable', detail: 'Array property', insertText: 'COUNT', snippet: false },
  { label: 'FIRST', kind: 'variable', detail: 'Array property', insertText: 'FIRST', snippet: false },
  { label: 'LAST', kind: 'variable', detail: 'Array property', insertText: 'LAST', snippet: false },
  { label: 'PUSH', kind: 'function', detail: 'Array method (value)', insertText: 'PUSH(${1:value})', snippet: true },
  { label: 'POP', kind: 'function', detail: 'Array method', insertText: 'POP()', snippet: true },
  { label: 'CLEAR', kind: 'function', detail: 'Array method', insertText: 'CLEAR()', snippet: true },
  { label: 'CONTAINS', kind: 'function', detail: 'Array method (value)', insertText: 'CONTAINS(${1:value})', snippet: true },
  { label: 'REMOVEAT', kind: 'function', detail: 'Array method (index)', insertText: 'REMOVEAT(${1:index})', snippet: true },
  { label: 'INSERTAT', kind: 'function', detail: 'Array method (index, value)', insertText: 'INSERTAT(${1:index}, ${2:value})', snippet: true },
];

// Namespace members (engine/Core/Eval/MathNamespace.Call, DateTimeNamespace.Call)
const namespaceMembers = {
  MATH: [
    { label: 'PI', kind: 'variable', detail: 'Math constant', insertText: 'PI', snippet: false },
    { label: 'E', kind: 'variable', detail: 'Math constant', insertText: 'E', snippet: false },
    { label: 'SQRT', kind: 'function', detail: 'MATH.SQRT(x)', insertText: 'SQRT(${1:x})', snippet: true },
    { label: 'ABS', kind: 'function', detail: 'MATH.ABS(x)', insertText: 'ABS(${1:x})', snippet: true },
    { label: 'POW', kind: 'function', detail: 'MATH.POW(x, y)', insertText: 'POW(${1:x}, ${2:y})', snippet: true },
    { label: 'FLOOR', kind: 'function', detail: 'MATH.FLOOR(x)', insertText: 'FLOOR(${1:x})', snippet: true },
    { label: 'CEIL', kind: 'function', detail: 'MATH.CEIL(x)', insertText: 'CEIL(${1:x})', snippet: true },
    { label: 'ROUND', kind: 'function', detail: 'MATH.ROUND(x)', insertText: 'ROUND(${1:x})', snippet: true },
    { label: 'TRUNC', kind: 'function', detail: 'MATH.TRUNC(x)', insertText: 'TRUNC(${1:x})', snippet: true },
    { label: 'SIN', kind: 'function', detail: 'MATH.SIN(x)', insertText: 'SIN(${1:x})', snippet: true },
    { label: 'COS', kind: 'function', detail: 'MATH.COS(x)', insertText: 'COS(${1:x})', snippet: true },
    { label: 'TAN', kind: 'function', detail: 'MATH.TAN(x)', insertText: 'TAN(${1:x})', snippet: true },
    { label: 'ASIN', kind: 'function', detail: 'MATH.ASIN(x)', insertText: 'ASIN(${1:x})', snippet: true },
    { label: 'ACOS', kind: 'function', detail: 'MATH.ACOS(x)', insertText: 'ACOS(${1:x})', snippet: true },
    { label: 'ATAN', kind: 'function', detail: 'MATH.ATAN(x)', insertText: 'ATAN(${1:x})', snippet: true },
    { label: 'LOG', kind: 'function', detail: 'MATH.LOG(x)', insertText: 'LOG(${1:x})', snippet: true },
    { label: 'LOG10', kind: 'function', detail: 'MATH.LOG10(x)', insertText: 'LOG10(${1:x})', snippet: true },
    { label: 'EXP', kind: 'function', detail: 'MATH.EXP(x)', insertText: 'EXP(${1:x})', snippet: true },
    { label: 'SIGN', kind: 'function', detail: 'MATH.SIGN(x)', insertText: 'SIGN(${1:x})', snippet: true },
    { label: 'MIN', kind: 'function', detail: 'MATH.MIN(x, y)', insertText: 'MIN(${1:x}, ${2:y})', snippet: true },
    { label: 'MAX', kind: 'function', detail: 'MATH.MAX(x, y)', insertText: 'MAX(${1:x}, ${2:y})', snippet: true },
    { label: 'CLAMP', kind: 'function', detail: 'MATH.CLAMP(x, min, max)', insertText: 'CLAMP(${1:x}, ${2:min}, ${3:max})', snippet: true },
    { label: 'MOD', kind: 'function', detail: 'MATH.MOD(x, y)', insertText: 'MOD(${1:x}, ${2:y})', snippet: true },
    { label: 'RANDOM', kind: 'function', detail: 'MATH.RANDOM([max[, min]])', insertText: 'RANDOM()', snippet: true },
  ],
  DATE: [
    { label: 'NOW', kind: 'function', detail: 'DATE.NOW()', insertText: 'NOW()', snippet: true },
    { label: 'YEAR', kind: 'function', detail: 'DATE.YEAR(days)', insertText: 'YEAR(${1:days})', snippet: true },
    { label: 'MONTH', kind: 'function', detail: 'DATE.MONTH(days)', insertText: 'MONTH(${1:days})', snippet: true },
    { label: 'DAY', kind: 'function', detail: 'DATE.DAY(days)', insertText: 'DAY(${1:days})', snippet: true },
    { label: 'DAYOFWEEK', kind: 'function', detail: 'DATE.DAYOFWEEK(days)', insertText: 'DAYOFWEEK(${1:days})', snippet: true },
  ],
  TIME: [
    { label: 'NOW', kind: 'function', detail: 'TIME.NOW()', insertText: 'NOW()', snippet: true },
    { label: 'HOUR', kind: 'function', detail: 'TIME.HOUR(millis)', insertText: 'HOUR(${1:millis})', snippet: true },
    { label: 'MINUTE', kind: 'function', detail: 'TIME.MINUTE(millis)', insertText: 'MINUTE(${1:millis})', snippet: true },
    { label: 'SECOND', kind: 'function', detail: 'TIME.SECOND(millis)', insertText: 'SECOND(${1:millis})', snippet: true },
  ],
};

// Stdlib function signatures for signature help (engine/Core/Eval/StandardLibrary.TryCall)
const stdlibSignatures = {
  STR: [{ label: 'value' }],
  NUMBER: [{ label: 'value' }],
  BOOL: [{ label: 'value' }],
  COUNT: [{ label: 'value' }],
  TYPEOF: [{ label: 'value' }],
  LEFT: [{ label: 's' }, { label: 'n' }],
  RIGHT: [{ label: 's' }, { label: 'n' }],
  TOUPPER: [{ label: 's' }],
  TOLOWER: [{ label: 's' }],
  TRIM: [{ label: 's' }],
};

// Namespace function signatures for signature help
const namespaceSignatures = {
  MATH: {
    PI: [], E: [],
    SQRT: [{ label: 'x' }], ABS: [{ label: 'x' }], POW: [{ label: 'x' }, { label: 'y' }],
    FLOOR: [{ label: 'x' }], CEIL: [{ label: 'x' }], ROUND: [{ label: 'x' }], TRUNC: [{ label: 'x' }],
    SIN: [{ label: 'x' }], COS: [{ label: 'x' }], TAN: [{ label: 'x' }],
    ASIN: [{ label: 'x' }], ACOS: [{ label: 'x' }], ATAN: [{ label: 'x' }],
    LOG: [{ label: 'x' }], LOG10: [{ label: 'x' }], EXP: [{ label: 'x' }], SIGN: [{ label: 'x' }],
    MIN: [{ label: 'x' }, { label: 'y' }], MAX: [{ label: 'x' }, { label: 'y' }],
    CLAMP: [{ label: 'x' }, { label: 'min' }, { label: 'max' }],
    MOD: [{ label: 'x' }, { label: 'y' }],
    RANDOM: [],
  },
  DATE: {
    NOW: [], YEAR: [{ label: 'days' }], MONTH: [{ label: 'days' }],
    DAY: [{ label: 'days' }], DAYOFWEEK: [{ label: 'days' }],
  },
  TIME: {
    NOW: [], HOUR: [{ label: 'millis' }], MINUTE: [{ label: 'millis' }], SECOND: [{ label: 'millis' }],
  },
};

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
  for (const n of namespaces) {
    if (!p || n.startsWith(p)) items.push(makeCompletion(n, 'variable', 'OSLANG namespace', n + '.', false));
  }
  for (const c of constructs) {
    const label = c.split(' ')[0] + ' snippet';
    if (!p || label.toUpperCase().startsWith(p)) items.push(makeCompletion(label, 'snippet', 'OSLANG construct', c, true));
  }
  return items;
}

function getMembersForType(type) {
  if (!type) return null;
  const t = type.toUpperCase();
  if (t === 'STRING') return stringMembers;
  if (t === 'NUMBER') return null; // engine has no Number method dispatchers
  if (t === 'BOOLEAN' || t === 'BOOL') return null; // engine has no Boolean method dispatchers
  if (t === 'ARRAY' || t.startsWith('ARRAY')) return arrayMembers;
  return null;
}

function getMembersForNamespace(ns) {
  return namespaceMembers[ns.toUpperCase()] || null;
}

function getStdlibSignature(name) {
  return stdlibSignatures[name.toUpperCase()] || null;
}

function getNamespaceSignature(ns, method) {
  const nsSig = namespaceSignatures[ns.toUpperCase()];
  if (!nsSig) return null;
  return nsSig[method.toUpperCase()] || null;
}

function isNamespace(name) {
  return namespaces.includes(name.toUpperCase());
}

module.exports = {
  keywords, types, stdlib, namespaces, namespaceMembers,
  stringMembers, arrayMembers,
  stdlibSignatures, namespaceSignatures,
  constructs, getCompletions,
  getMembersForType, getMembersForNamespace,
  getStdlibSignature, getNamespaceSignature, isNamespace,
  makeCompletion
};
