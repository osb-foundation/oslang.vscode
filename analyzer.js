'use strict';

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
      toks.push({ type: 'ident', value: line.slice(i, j).toUpperCase(), start: i });
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
  // find '(' ... ')'
  let depth = 0, start = -1;
  for (let i = 0; i < tokList.length; i++) {
    if (tokList[i].value === '(') { if (depth === 0) start = i + 1; depth++; }
    else if (tokList[i].value === ')') { depth--; if (depth === 0 && start >= 0) {
      // split by comma at depth 0
      let cur = [];
      let d = 0;
      for (let j = start; j < i; j++) {
        if (tokList[j].value === '(') d++;
        else if (tokList[j].value === ')') d--;
        if (d === 0 && tokList[j].value === ',') {
          if (cur.length) params.push(cur.map(t=>t.value).join(''));
          cur = [];
        } else cur.push(tokList[j]);
      }
      if (cur.length) params.push(cur.map(t=>t.value).join(''));
      break;
    } }
  }
  // params may be "name" or "name AS type" or "name:type"; take first ident
  return params.map(p => {
    const m = p.match(/[A-Za-z_][A-Za-z0-9_]*/);
    return m ? m[0].toUpperCase() : null;
  }).filter(Boolean);
}

function analyze(text, cursorOffset) {
  const lines = text.split('\n');
  // find cursor line/col
  let off = 0, cursorLine = 0, cursorCol = 0;
  for (let i = 0; i < lines.length; i++) {
    if (off + lines[i].length + 1 > cursorOffset) { cursorLine = i; cursorCol = cursorOffset - off; break; }
    off += lines[i].length + 1;
    if (i === lines.length - 1) { cursorLine = i; cursorCol = lines[i].length; }
  }

  const scopes = []; // stack of {kind, symbols: Map name->info}
  const global = { kind: 'global', symbols: new Map() };
  scopes.push(global);

  // We need to process up to cursor. Track scope by line.
  let inFunction = null;
  for (let li = 0; li <= cursorLine; li++) {
    const line = lines[li];
    const toks = tokenizeLine(line);
    const first = toks.length ? toks[0].value : '';
    // Determine if this line is before/equal cursor; for cursor line, only consider declarations fully before cursor col? We'll process whole line but symbols declared after cursor excluded.
    const limitCol = (li === cursorLine) ? cursorCol : line.length + 1;

    // Block open
    if (BLOCK_OPEN.has(first)) {
      if (first === 'FUNCTION' || first === 'SUB') {
        const nameTok = toks[1];
        const name = nameTok ? nameTok.value : null;
        const scope = { kind: 'function', name, symbols: new Map(), params: parseParams(toks) };
        for (const p of scope.params) scope.symbols.set(p, { kind: 'parameter', name: p });
        if (name) global.symbols.set(name, { kind: 'function', name });
        scopes.push(scope);
      } else {
        scopes.push({ kind: first.toLowerCase(), symbols: new Map() });
      }
      // declarations on same line? handle VAR after? skip
      continue;
    }
    // Block close
    if (first === 'END' || first === 'NEXT' || first === 'LOOP' || first === 'WEND') {
      if (scopes.length > 1) scopes.pop();
      continue;
    }

    // Declarations
    // VAR a, b  or  VAR a AS type
    if (first === 'VAR' || first === 'GLOBAL' || first === 'DIM') {
      // parse identifiers until limit
      let i = 1;
      while (i < toks.length && toks[i].start < limitCol) {
        if (toks[i].type === 'ident') {
          const name = toks[i].value;
          const target = (first === 'GLOBAL') ? global : scopes[scopes.length - 1];
          if (!target.symbols.has(name)) target.symbols.set(name, { kind: 'variable', name });
        }
        i++;
      }
    }
    // Assignment can introduce? no
    // Function call doesn't declare
  }

  // Collect visible symbols: all scopes from global to current, inner shadow outer
  const result = [];
  const seen = new Set();
  // global first (lowest priority), then outer to inner
  for (const sc of scopes) {
    for (const [name, info] of sc.symbols) {
      if (!seen.has(name)) {
        seen.add(name);
        result.push({ label: name, kind: info.kind === 'function' ? 'function' : (info.kind === 'parameter' ? 'variable' : 'variable'), detail: info.kind });
      }
    }
  }
  // Actually shadowing: inner should override; our loop adds outer first then inner? We pushed global first; scopes order outer->inner. If we skip seen, outer wins. Need inner first. Redo: iterate scopes reversed.
  const result2 = [];
  const seen2 = new Set();
  for (let i = scopes.length - 1; i >= 0; i--) {
    for (const [name, info] of scopes[i].symbols) {
      if (!seen2.has(name)) {
        seen2.add(name);
        result2.push({ label: name, kind: info.kind === 'function' ? 'function' : 'variable', detail: 'OSLANG ' + info.kind });
      }
    }
  }
  return result2;
}

function getContextCompletions(text, cursorOffset) {
  try {
    return analyze(text, cursorOffset);
  } catch (e) {
    return [];
  }
}

module.exports = { tokenizeLine, analyze, getContextCompletions, parseParams };
