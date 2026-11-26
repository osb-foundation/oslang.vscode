# Changelog

All notable changes to the OSLANG VS Code / VSCodium extension are documented here.
The extension version is independent of the OSLANG language version (0.8).

## [0.1.4] - 2026-11-26

### Added

- Completed context-aware IntelliSense (Card 1.2.2 rework):
  - Dot-triggered member completion for primitives: string (`TOUPPER`, `TOLOWER`, `LENGTH`, `COUNT`, `SUBSTRING`, `SUBSTR`, `INDEXOF`, `TRIM`) and array (`COUNT`, `FIRST`, `LAST`, `PUSH`, `POP`, `CLEAR`, `CONTAINS`, `REMOVEAT`, `INSERTAT`).
  - Dot-triggered member completion for namespaces: `MATH` (`PI`, `E`, `SQRT` … `RANDOM`), `DATE` (`NOW`, `YEAR`, `MONTH`, `DAY`, `DAYOFWEEK`), `TIME` (`NOW`, `HOUR`, `MINUTE`, `SECOND`).
  - Prefix filtering after the dot (e.g. `MATH.S` → `SQRT`, `SIN`, `SIGN`).
  - Function signature help for user functions, standard-library functions, and `MATH` / `DATE` / `TIME` namespace methods, with parameter names and depth-aware active-parameter detection (commas inside nested calls are not counted).
  - Ctrl+Space scope-aware completion (variables, parameters, functions visible at the cursor).
- Automated tests for member completion, receiver-type detection, signature help, and active-parameter calculation (`test/members.js`).
- Specification and source traceability section in the README, mapping each IntelliSense feature to the authoritative engine source.

### Changed

- Member and signature data derived from the actual engine implementation in `osb.oslang/engine/Core/Eval` (`StringMethods`, `ArrayMethods`, `MathNamespace`, `DateTimeNamespace`, `StandardLibrary`).
- `extension.js` preserves `insertText` / snippet from context items so method snippets (e.g. `SQRT(${1:x})`) insert correctly.

### Known limitations

- `NUMBER` and `BOOLEAN` have no method dispatchers in the engine; no members are offered for them.
- Type inference is limited to explicit `VAR name TYPE` declarations and literals; no propagation through assignments.
- `FILE`, `DIR`, `OSL`, `OSB` are recognized as namespaces but expose no members.
- Signature labels show parameter names only; parameter types are used for receiver inference, not rendered.

## [0.1.3] - 2026-11-26

### Added

- Context-aware IntelliSense iteration (Card 1.2.2): receiver-type detection and member completion groundwork, signature-help plumbing, and namespace/signature data.

## [0.1.2] - 2026-11-26

### Added

- Context-aware autocomplete (Card 1.2.2, initial): scope analysis for variables, parameters, and functions visible at the cursor.

## [0.1.1] - 2026-11-26

### Added

- Static autocomplete (Card 1.2.1): keywords, types, standard-library functions, namespaces, and construct snippets, filtered by the current word prefix.

## [0.1.0] - 2026-11-26

### Added

- Definitive OSLANG 0.8 extension for Visual Studio Code and VSCodium
- Language registration: id `oslang`, aliases `OSLANG`/`oslang`, file extension `.osl`
- TextMate grammar `source.oslang` covering OSLANG 0.8 lexical constructs: keywords, types, operators, numeric/string/date-time literals, booleans, null, comments, identifiers
- Language configuration: comments (`'` line, `/* */` block), brackets, auto-closing/surrounding pairs, indentation rules
- TextMate tokenization tests (`test/tokenize.js`) exercising real `.osl` examples, with locked dev dependencies (`vscode-textmate`, `vscode-oniguruma`)
- Reproducible local VSIX packaging via `vsce package`; `.vscodeignore` limits package contents
- README, LICENSE (MIT), CHANGELOG

### Removed (from previous OSLANG extension line)

- Autocomplete/IntelliSense, hover, signature help, document symbols, code folding, snippets (out of scope for this card; autocomplete and signature help were reintroduced in 0.1.1–0.1.4)