# AGENTS.md — OSLANG VS Code Extension (Card 1.2)

This file guides coding agents working in the `oslang.vscode` repository.

## Project Identity

**OSLANG VS Code Extension** provides syntax highlighting and editor configuration for OSLANG 0.8 (the scripting language of OSB) in Visual Studio Code and VSCodium.

**Extension identity:** name `oslang`, display name `OSLANG`, publisher `osb-foundation`, version `0.1.0`, language id `oslang`, file extension `.osl`, scope name `source.oslang`.

## Scope (Card 1.2 — definitive)

Language recognition, editor configuration, and syntax highlighting ONLY.

Delivered:
- `package.json` — extension manifest (no `main`, no `activationEvents`; grammar/config-only extension)
- `language-configuration.json` — comments, brackets, auto-closing/surrounding pairs, indentation
- `syntaxes/oslang.tmLanguage.json` — TextMate grammar for OSLANG 0.8
- `test/tokenize.js` — real TextMate tokenization tests (vscode-textmate + vscode-oniguruma)
- `README.md`, `CHANGELOG.md`, `LICENSE`, `.vscodeignore`
- VSIX packaging via `vsce package` (`oslang-0.1.0.vsix`)

Not delivered (out of scope, other cards): extension host logic (`extension.js` removed), snippets (removed), autocomplete/IntelliSense, hover, signature help, document symbols, folding, LSP, parser, compilation, execution, diagnostics, debugger.

## Code policy

- Keep the grammar in sync with the OSLANG 0.8 specification (`osb.oslang/OSLANG-0.8-SPEC.md`; syntax preserved from 0.73 — 0.8 adds no syntax). Do not invent syntax or editor behavior.
- Keywords are case-insensitive per the OSLANG lexer (`ASCII-only` matching).
- Tests exercise the real grammar through vscode-textmate; do not substitute source-string searches for tokenization tests.
- Lock dev dependency versions in package.json/package-lock.json.

## Build and validation

```bash
npm install        # locked dev dependencies
npm test           # node test/tokenize.js
npm run package    # vsce package -> oslang-0.1.0.vsix
```

## Change workflow for agents

1. Inspect relevant files first (spec, lexer Keywords.cs/TokenType.cs/Lexer.cs for the authoritative syntax).
2. Keep edits targeted.
3. Run `npm test` before considering a change complete.
4. Update the version in package.json only for significant scoped changes; the extension version is independent of the OSLANG language version.

## Non-goals and cautions

- Do not implement autocomplete, LSP, parser, execution, diagnostics, or debugger features.
- Do not publish the VSIX to any Marketplace.
- The local publisher id `osb-foundation` does not prove Marketplace ownership.
