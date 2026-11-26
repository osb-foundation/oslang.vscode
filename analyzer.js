'use strict';

const BLOCK_OPEN = new Set(['FUNCTION','SUB','CLASS','INTERFACE','IF','FOR','WHILE','DO','TRY','SWITCH','ENUM']);
const BLOCK_CLOSE = new Set(['END','NEXT','LOOP','WEND']);

const STRING_MEMBERS = ['TOUPPER','NORMALIZE','TOLOWER','TRIM','STARTSWITH','ENDSWITH','CONTAINS','INDEXOF','SUBSTR','REPLACE','SPLIT','COUNT','ISEMPTY','REVERSE','TOSTRING','PADSTART','PADEND','REPEAT','LEFT','RIGHT','FIND','INSERT','REMOVE'];
const NUMBER_MEMBERS = ['TOSTRING','ABS','FLOOR','CEIL','ISINTEGER','BETWEEN','TRUNC'];
const BOOLEAN_MEMBERS = ['TOSTRING','TOGGLE'];
const ARRAY_MEMBERS = ['COUNT','FIRST','LAST','CONTAINS','INDEXOF','ADD','REMOVE'];

function tokenizeLine(line) {
  const toks = [];
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\'') break;
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      toks.push({ type: 'ident', value: line.slice(i, j).toUpperCase(), start: i, raw: line.slice(i,j) });
      i = j;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      toks.push({ type: 'num', value: line.slice(i, j), start: i });
      i = j;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') j++;
      toks.push({ type: 'str', value: line.slice(i, j + 1), start: i });
      i = j + 1;
      continue;
    }
    toks.push({ type: 'sym', value: c, start: i });
    i++;
  }
  return toks;
}

function parseParams(tokList) {
  const params = [];
  let depth = 0, start = -1, end = -1;
  for (let i = 0; i < tokList.length; i++) {
    if (tokList[i].value === '(') { if (depth === 0) start = i + 1; depth++; }
    else if (tokList[i].value === ')') { depth--; if (depth === 0 && start >= 0) { end = i; break; } }
  }
  if (start < 0 || end < 0) return params;
  // split
  const groups = [];
  let cur = [], d = 0;
  for (let j = start; j < end; j++) {
    if (tokList[j].value === '(') d++;
    else if (tokList[j].value === ')') d--;
    if (d === 0 && tokList[j].value === ',') {
      if (cur.length) groups.push(cur); cur = [];
    } else cur.push(tokList[j]);
  }
  if (cur.length) groups.push(cur);
  for (const g of groups) {
    // name [AS type] or name:type
    const nameTok = g.find(t => t.type === 'ident');
    if (!nameTok) continue;
    let type = null;
    const asIdx = g.findIndex(t => t.value === 'AS' || t.value === ':');
    if (asIdx >= 0 && g[asIdx+1] && g[asIdx+1].type === 'ident') type = g[asIdx+1].value;
    params.push({ name: nameTok.value, type });
  }
  return params;
}

function inferTypeFromTokens(toks) {
  // returns type string or null
  // check AS type
  const asIdx = toks.findIndex(t => t.value === 'AS' || t.value === ':');
  if (asIdx >= 0 && toks[asIdx+1] && toks[asIdx+1].type === 'ident') return toks[asIdx+1].value;
  // literal
  const lit = toks.find(t => t.type === 'str');
  if (lit) return 'STRING';
  const num = toks.find(t => t.type === 'num');
  if (num && !toks.find(t=>t.type==='ident' && t.value !== num.value)) {
    // only number
    if (toks.filter(t=>t.type==='ident').length === 0) return 'NUMBER';
  }
  const id = toks.find(t => t.type === 'ident');
  if (id && (id.value === 'TRUE' || id.value === 'FALSE')) return 'BOOLEAN';
  return null;
}

function analyze(text, cursorOffset) {
  const lines = text.split('\n');
  let off = 0, cursorLine = 0, cursorCol = 0;
  for (let i = 0; i < lines.length; i++) {
    if (off + lines[i].length + 1 > cursorOffset) { cursorLine = i; cursorCol = cursorOffset - off; break; }
    off += lines[i].length + 1;
    if (i === lines.length - 1) { cursorLine = i; cursorCol = lines[i].length; }
  }

  const scopes = [];
  const global = { kind: 'global', symbols: new Map() };
  scopes.push(global);

  for (let li = 0; li <= cursorLine; li++) {
    const line = lines[li];
    const toks = tokenizeLine(line);
    const first = toks.length ? toks[0].value : '';
    const limitCol = (li === cursorLine) ? cursorCol : line.length + 1;

    if (BLOCK_OPEN.has(first)) {
      if (first === 'FUNCTION' || first === 'SUB') {
        const nameTok = toks[1];
        const name = nameTok ? nameTok.value : null;
        const params = parseParams(toks);
        const scope = { kind: 'function', name, symbols: new Map(), params: params.map(p=>p.name), paramTypes: params };
        for (const p of params) scope.symbols.set(p.name, { kind: 'parameter', name: p.name, type: p.type });
        if (name) global.symbols.set(name, { kind: 'function', name, params: params.map(p=>p.name), paramTypes: params });
        scopes.push(scope);
      } else {
        scopes.push({ kind: first.toLowerCase(), symbols: new Map() });
      }
      continue;
    }
    if (first === 'END' || first === 'NEXT' || first === 'LOOP' || first === 'WEND') {
      if (scopes.length > 1) scopes.pop();
      continue;
    }

    if (first === 'VAR' || first === 'GLOBAL' || first === 'DIM') {
      // parse comma-separated declarations
      // collect toks after first until limit
      const declToks = toks.filter(t => t.start < limitCol).slice(1);
      // split by comma at top level
      const groups = [];
      let cur = [], d = 0;
      for (const t of declToks) {
        if (t.value === '(') d++;
        else if (t.value === ')') d--;
        if (d === 0 && t.value === ',') { if (cur.length) groups.push(cur); cur = []; }
        else cur.push(t);
      }
      if (cur.length) groups.push(cur);
      for (const g of groups) {
        const nameTok = g.find(t => t.type === 'ident');
        if (!nameTok) continue;
        const name = nameTok.value;
        const type = inferTypeFromTokens(g);
        const target = (first === 'GLOBAL') ? global : scopes[scopes.length-1];
        if (!target.symbols.has(name)) target.symbols.set(name, { kind: 'variable', name, type });
        else target.symbols.get(name).type = type || target.symbols.get(name).type;
      }
    }
  }

  // collect visible
  const result = [];
  const seen = new Set();
  for (let i = scopes.length - 1; i >= 0; i--) {
    for (const [name, info] of scopes[i].symbols) {
      if (!seen.has(name)) {
        seen.add(name);
        result.push({ label: name, kind: info.kind === 'function' ? 'function' : 'variable', detail: 'OSLANG ' + info.kind, type: info.type || null, params: info.params, paramTypes: info.paramTypes });
      }
    }
  }
  return result;
}

function getMemberCompletions(text, cursorOffset) {
  // find receiver expression before dot
  const lines = text.split('\n');
  let off = 0, cursorLine = 0, cursorCol = 0;
  for (let i = 0; i < lines.length; i++) {
    if (off + lines[i].length + 1 > cursorOffset) { cursorLine = i; cursorCol = cursorOffset - off; break; }
    off += lines[i].length + 1;
    if (i === lines.length - 1) { cursorLine = i; cursorCol = lines[i].length; }
  }
  const line = lines[cursorLine];
  // text before cursor on this line
  const before = line.slice(0, cursorCol);
  // find last dot
  const dotIdx = before.lastIndexOf('.');
  if (dotIdx < 0) return [];
  const expr = before.slice(0, dotIdx).trim();
  // receiver identifier = last ident
  const m = expr.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (!m) return [];
  const recvName = m[0].toUpperCase();
  // determine type
  const syms = analyze(text, cursorOffset);
  const sym = syms.find(s => s.label === recvName);
  let type = sym ? sym.type : null;
  // if no type but name is string-ish? unknown -> no members
  const members = membersForType(type);
  if (!members) return [];
  return members.map(mem => ({ label: mem, kind: 'function', detail: 'OSLANG member', insertText: mem }));
}

function membersForType(type) {
  if (!type) return null;
  const t = type.toUpperCase();
  if (t === 'STRING') return STRING_MEMBERS;
  if (t === 'NUMBER') return NUMBER_MEMBERS;
  if (t === 'BOOLEAN' || t === 'BOOL') return BOOLEAN_MEMBERS;
  if (t === 'ARRAY' || t.startsWith('ARRAY')) return ARRAY_MEMBERS;
  return null;
}

function getSignatureHelp(text, cursorOffset) {
  // find function name before '(' matching current open paren
  // simple: scan backwards to find nearest unmatched '('
  const before = text.slice(0, cursorOffset);
  let depth = 0, i = before.length - 1;
  let start = -1;
  for (; i >= 0; i--) {
    const c = before[i];
    if (c === ')') depth++;
    else if (c === '(') {
      if (depth === 0) { start = i; break; }
      depth--;
    }
  }
  if (start < 0) return null;
  // function name before '('
  const nameMatch = before.slice(0, start).match(/[A-Za-z_][A-Za-z0-9_]*\s*$/);
  if (!nameMatch) return null;
  const name = nameMatch[0].trim().toUpperCase();
  // active param = count commas at depth 0 between start and cursor
  let active = 0, d = 0;
  for (let j = start + 1; j < cursorOffset; j++) {
    const c = text[j];
    if (c === '(') d++;
    else if (c === ')') d--;
    else if (c === ',' && d === 0) active++;
  }
  // resolve function symbol
  const syms = analyze(text, cursorOffset);
  const sym = syms.find(s => s.label === name && s.kind === 'function');
  let params = sym && sym.paramTypes ? sym.paramTypes : null;
  // stdlib: no params known -> empty
  if (!params) params = [];
  const sigLabel = name + '(' + params.map(p => (p.name || '') + (p.type ? ' AS ' + p.type : '')).join(', ') + ')';
  return {
    signatures: [{ label: sigLabel, parameters: params.map(p => ({ label: p.name || '' })) }],
    activeSignature: 0,
    activeParameter: active
  };
}

function getContextCompletions(text, cursorOffset) {
  try {
    const before = text.slice(0, cursorOffset);
    if (before.trimEnd().endsWith('.')) {
      return getMemberCompletions(text, cursorOffset);
    }
    return analyze(text, cursorOffset);
  } catch (e) {
    return [];
  }
}

module.exports = { tokenizeLine, analyze, getContextCompletions, parseParams, getMemberCompletions, getSignatureHelp, membersForType };
