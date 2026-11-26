'use strict';

const data = require('./completion-data');

const BLOCK_OPEN = new Set(['FUNCTION','SUB','CLASS','INTERFACE','IF','FOR','WHILE','DO','TRY','SWITCH','ENUM']);
const BLOCK_CLOSE = new Set(['END','NEXT','LOOP','WEND']);

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
  const asIdx = toks.findIndex(t => t.value === 'AS' || t.value === ':');
  if (asIdx >= 0 && toks[asIdx+1] && toks[asIdx+1].type === 'ident') return toks[asIdx+1].value;
  const lit = toks.find(t => t.type === 'str');
  if (lit) return 'STRING';
  const num = toks.find(t => t.type === 'num');
  if (num && toks.filter(t=>t.type==='ident').length === 0) return 'NUMBER';
  const id = toks.find(t => t.type === 'ident');
  if (id && (id.value === 'TRUE' || id.value === 'FALSE')) return 'BOOLEAN';
  // VAR name TYPE pattern: second ident is the type (e.g. VAR s STRING)
  const idents = toks.filter(t => t.type === 'ident');
  if (idents.length >= 2) {
    const candidate = idents[1].value;
    if (['STRING','NUMBER','BOOLEAN','BOOL','OBJECT','ARRAY'].includes(candidate)) return candidate;
  }
  return null;
}

function locateCursor(text, cursorOffset) {
  const lines = text.split('\n');
  let off = 0, cursorLine = 0, cursorCol = 0;
  for (let i = 0; i < lines.length; i++) {
    if (off + lines[i].length + 1 > cursorOffset) { cursorLine = i; cursorCol = cursorOffset - off; break; }
    off += lines[i].length + 1;
    if (i === lines.length - 1) { cursorLine = i; cursorCol = lines[i].length; }
  }
  return { lines, cursorLine, cursorCol, off };
}

function analyze(text, cursorOffset) {
  const { lines, cursorLine, cursorCol } = locateCursor(text, cursorOffset);

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
      const declToks = toks.filter(t => t.start < limitCol).slice(1);
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

function getAllFunctions(text) {
  const lines = text.split('\n');
  const funcs = new Map();
  for (const line of lines) {
    const toks = tokenizeLine(line);
    const first = toks.length ? toks[0].value : '';
    if (first === 'FUNCTION' || first === 'SUB') {
      const nameTok = toks[1];
      const name = nameTok ? nameTok.value : null;
      const params = parseParams(toks);
      if (name) funcs.set(name, { kind: 'function', name, params: params.map(p=>p.name), paramTypes: params });
    }
  }
  return funcs;
}

// Determine the type of the receiver expression before the last '.' on the cursor line.
// Returns: null (no dot), 'STRING', 'NUMBER', 'BOOLEAN', 'NAMESPACE:<NS>', or a variable type string.
function getReceiverType(text, cursorOffset) {
  const { lines, cursorLine, cursorCol } = locateCursor(text, cursorOffset);
  const line = lines[cursorLine];
  const before = line.slice(0, cursorCol);
  const dotIdx = before.lastIndexOf('.');
  if (dotIdx < 0) return null;
  const expr = before.slice(0, dotIdx).trim();
  if (!expr) return null;

  if (expr.startsWith('"') && expr.endsWith('"') && expr.length >= 2) return 'STRING';
  if (/^\d+(\.\d+)?$/.test(expr)) return 'NUMBER';
  if (expr === 'TRUE' || expr === 'FALSE') return 'BOOLEAN';
  if (data.isNamespace(expr)) return 'NAMESPACE:' + expr.toUpperCase();
  const syms = analyze(text, cursorOffset);
  const sym = syms.find(s => s.label === expr.toUpperCase());
  return sym ? sym.type : null;
}

// All members for a receiver type (no prefix filtering). Used by tests and internally.
function getAllMembers(receiverType) {
  if (!receiverType) return [];
  if (receiverType.startsWith('NAMESPACE:')) {
    const ns = receiverType.slice('NAMESPACE:'.length);
    const members = data.getMembersForNamespace(ns);
    return members ? members.map(m => ({ label: m.label, kind: m.kind, detail: m.detail, insertText: m.insertText, snippet: m.snippet })) : [];
  }
  const members = data.getMembersForType(receiverType);
  return members ? members.map(m => ({ label: m.label, kind: m.kind, detail: m.detail, insertText: m.insertText, snippet: m.snippet })) : [];
}

function getMemberCompletions(text, cursorOffset) {
  const receiverType = getReceiverType(text, cursorOffset);
  return getAllMembers(receiverType);
}

function findCallAtCursor(text, cursorOffset) {
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

  let j = start - 1;
  while (j >= 0 && (before[j] === ' ' || before[j] === '\t')) j--;
  let nameEnd = j;
  while (j >= 0 && (/[A-Za-z0-9_]/.test(before[j]) || before[j] === '.')) j--;
  const name = before.slice(j + 1, nameEnd + 1);
  if (!name) return null;

  const dotIdx = name.indexOf('.');
  if (dotIdx >= 0) {
    return { start, name, namespace: name.slice(0, dotIdx).toUpperCase(), method: name.slice(dotIdx + 1).toUpperCase() };
  }
  return { start, name: name.toUpperCase(), namespace: null, method: null };
}

function countActiveParameter(text, start, cursorOffset) {
  let active = 0, d = 0;
  for (let j = start + 1; j < cursorOffset; j++) {
    const c = text[j];
    if (c === '(') d++;
    else if (c === ')') d--;
    else if (c === ',' && d === 0) active++;
  }
  return active;
}

function getSignatureHelp(text, cursorOffset) {
  const call = findCallAtCursor(text, cursorOffset);
  if (!call) return null;

  const active = countActiveParameter(text, call.start, cursorOffset);
  let params = null;
  let sigLabel = null;

  if (call.namespace) {
    const nsSig = data.getNamespaceSignature(call.namespace, call.method);
    if (nsSig) {
      params = nsSig;
      sigLabel = call.namespace + '.' + call.method + '(' + params.map(p => p.label).join(', ') + ')';
    }
  } else {
    const stdSig = data.getStdlibSignature(call.name);
    if (stdSig) {
      params = stdSig;
      sigLabel = call.name + '(' + params.map(p => p.label).join(', ') + ')';
    } else {
      const funcs = getAllFunctions(text);
      const sym = funcs.get(call.name);
      if (sym && sym.paramTypes) {
        params = sym.paramTypes.map(p => ({ label: p.name || '' }));
        sigLabel = call.name + '(' + params.map(p => p.label).join(', ') + ')';
      }
    }
  }

  if (!sigLabel) return null;

  return {
    signatures: [{ label: sigLabel, parameters: params.map(p => ({ label: p.label })) }],
    activeSignature: 0,
    activeParameter: Math.min(active, params.length - 1)
  };
}

function getContextCompletions(text, cursorOffset) {
  try {
    const { lines, cursorLine, cursorCol } = locateCursor(text, cursorOffset);
    const line = lines[cursorLine];
    const before = line.slice(0, cursorCol);
    const dotIdx = before.lastIndexOf('.');
    if (dotIdx >= 0) {
      const prefix = before.slice(dotIdx + 1).toUpperCase();
      const receiverType = getReceiverType(text, cursorOffset);
      if (!receiverType) return [];
      const members = getAllMembers(receiverType);
      return members.filter(m => !prefix || m.label.startsWith(prefix));
    }
    return analyze(text, cursorOffset);
  } catch (e) {
    return [];
  }
}

module.exports = { tokenizeLine, analyze, getContextCompletions, parseParams, getMemberCompletions, getSignatureHelp, getReceiverType, getAllFunctions, getAllMembers };
