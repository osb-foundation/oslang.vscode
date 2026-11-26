# Changelog

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

- Autocomplete/IntelliSense, hover, signature help, document symbols, code folding, snippets (out of scope for this card)
