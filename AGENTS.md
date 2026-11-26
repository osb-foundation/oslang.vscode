# AGENTS.md — OSLANG VS Code Extension (Card 1.2 / 1.2.2)

This file guides coding agents working in the `oslang.vscode` repository.

## Project Identity

**OSLANG VS Code Extension** provides syntax highlighting, editor configuration, and context-aware IntelliSense for OSLANG 0.8 (the scripting language of OSB) in Visual Studio Code and VSCodium.

**Extension identity:** name `oslang`, display name `OSLANG`, publisher `osb-foundation`, version `0.1.4`, language id `oslang`, file extension `.osl`, scope name `source.oslang`.

## Scope

Language recognition, editor configuration, syntax highlighting, and IntelliSense.

Delivered:
- `package.json` — extension manifest (`main: extension.js`, `activationEvents: onLanguage:oslang`)
- `language-configuration.json` — comments, brackets, auto-closing/surrounding pairs, indentation
- `syntaxes/oslang.tmLanguage.json` — TextMate grammar for OSLANG 0.8
- `extension.js` — registers CompletionItemProvider (letters + `.`) and SignatureHelpProvider (`(`, `,`)
- `analyzer.js` — scope/symbol analysis, receiver-type detection, member completion, signature help with active-parameter calculation
- `completion-data.js` — static data: keywords, types, stdlib, namespaces, string/array/namespace members, signatures
- `test/tokenize.js`, `test/completion.js`, `test/context.js`, `test/members.js` — automated tests
- `README.md`, `CHANGELOG.md`, `LICENSE`, `.vscodeignore`
- VSIX packaging via `vsce package` (`oslang-0.1.4.vsix`)

Not delivered (out of scope, other cards): hover, document symbols, folding, snippets beyond construct snippets, LSP, parser, compilation, execution, diagnostics, debugger.

## Code policy

- Keep the grammar in sync with the OSLANG 0.8 specification (`osb.oslang/OSLANG-0.8-SPEC.md`; syntax preserved from 0.73 — 0.8 adds no syntax). Do not invent syntax or editor behavior.
- IntelliSense member/signature data must be derived from the actual engine implementation in `osb.oslang/engine/Core/Eval` (`StringMethods`, `ArrayMethods`, `MathNamespace`, `DateTimeNamespace`, `StandardLibrary`). Do not offer members or signatures the engine does not dispatch on.
- Keywords are case-insensitive per the OSLANG lexer (`ASCII-only` matching).
- Tests exercise the real grammar through vscode-textmate and the real analyzer/completion-data modules; do not substitute source-string searches for tokenization tests.
- Lock dev dependency versions in package.json/package-lock.json.

## Build and validation

```bash
npm install        # locked dev dependencies
npm test           # node test/tokenize.js && completion.js && context.js && members.js
npm run package    # vsce package -> oslang-0.1.4.vsix
```

## Change workflow for agents

1. Inspect relevant files first (spec, lexer `Keywords.cs`/`TokenType.cs`/`Lexer.cs` for the authoritative syntax; engine `Core/Eval` for member/signature data).
2. Keep edits targeted.
3. Run `npm test` before considering a change complete.
4. Update the version in package.json only for significant scoped changes; the extension version is independent of the OSLANG language version.

## Non-goals and cautions

- Do not implement hover, LSP, parser, execution, diagnostics, or debugger features.
- Do not publish the VSIX to any Marketplace.
- The local publisher id `osb-foundation` does not prove Marketplace ownership.