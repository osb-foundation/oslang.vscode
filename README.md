# OSLANG - VS Code / VSCodium Extension

Syntax highlighting and editor configuration for **OSLANG 0.8**, the scripting language of OSB, in Visual Studio Code and VSCodium.

## Scope

This extension provides **language recognition, editor configuration, and syntax highlighting only**:

- Automatic file association for `.osl` files (language id: `oslang`)
- Syntax highlighting based on the OSLANG 0.8 lexical grammar (keywords, types, operators, numeric/string/date-time literals, booleans, null, comments)
- Editor configuration: line and block comments, brackets, auto-closing/surrounding pairs, indentation rules

It deliberately does **not** provide autocomplete/IntelliSense, hover, signature help, document symbols, folding, a language server, a parser, compilation, execution, diagnostics, or a debugger. Those features belong to other roadmap cards.

## Supported language version

OSLANG 0.8 (syntax preserved from OSLANG 0.73; OSLANG 0.8 introduces no syntax changes). File extension: `.osl`.

The extension's own version (`0.1.0`) is independent of the OSLANG language version.

## Features

### Syntax highlighting (`source.oslang`)

- Keywords and reserved words (case-insensitive, e.g. `FUNCTION`, `IF`, `THEN`, `END`, `VAR`, `CLASS`, `ENUM`, `USING`, `TRY`, `CATCH`, `SWITCH`, `CASE`, `DEFAULT`, `FOR`, `WHILE`, `DO`, ...)
- Declaration keywords (`FUNCTION`, `CLASS`, `INTERFACE`, `ENUM`, `VAR`, `GLOBAL`, ...)
- Modifiers (`PUBLIC`, `PRIVATE`, `PROTECTED`, `VIRTUAL`, `OVERRIDE`)
- Types (`NUMBER`, `STRING`, `BOOLEAN`, `BOOL`, `OBJECT`)
- Constants (`TRUE`, `FALSE`, `NULL`)
- Operators (`+ - * / % ** ++ -- += => -> == <> <= >= < > = | MOD`, and logical `AND`/`OR`/`NOT`)
- Punctuation `( ) [ ] { } , : .`
- Numeric literals (`42`, `3.14`)
- Date/time literals (`#2026-11-26#`, `#14:30:45#`)
- Strings (`"..."`) with `""` escaped quotes and `\n`, `\t`, `\\`, `\"` escapes
- Comments: `'` line comments, `REM` line comments, `/* ... */` block comments
- Identifiers and dotted namespace access (`OSL.CONSOLE.WRITE(...)`)

### Editor configuration

- Comments: line `'`, block `/* */`
- Brackets: `( )`, `[ ]`, `{ }`
- Auto-closing and surrounding pairs for `'`, `"`, `( )`, `[ ]`, `{ }`
- Indentation rules: blocks opened by `CLASS`, `INTERFACE`, `FUNCTION`, `CONSTRUCTOR`, `IF`, `ELIF`, `ELSE`, `FOR`, `WHILE`, `DO`, `TRY`, `CATCH`, `SWITCH`, `CASE`, `DEFAULT`, `ENUM` increase indentation; `END` decreases it

## Installation from the local VSIX

1. Obtain the VSIX (see "Building" below), e.g. `oslang-0.1.0.vsix`.
2. Install it into an isolated editor profile so it does not interfere with your existing extensions:

   Visual Studio Code:
   ```bash
   code --install-extension oslang-0.1.0.vsix --user-data-dir /tmp/kilo/vscode-oslang
   ```

   VSCodium:
   ```bash
   codium --install-extension oslang-0.1.0.vsix --user-data-dir /tmp/kilo/vscodium-oslang
   ```
3. Open or create a `.osl` file. The OSLANG language mode activates automatically and syntax highlighting applies.

### Updating

Uninstall the previous version, then install the new VSIX with the same `--install-extension` command. The extension version (`0.1.0`) is independent of the OSLANG language version (0.8).

## Supported editors

- Visual Studio Code (engine `^1.80.0` declared in package.json)
- VSCodium (validated with VSCodium 1.143.x in this environment)

Visual Studio Code was not available in the validation environment; only VSCodium was installed and tested.

## Building and testing

Prerequisites: Node.js (v24 used for validation) and npm.

```bash
# Install locked development dependencies (test tooling + vsce packager)
npm install

# Run the TextMate tokenization tests
npm test

# Package the VSIX
npm run package   # i.e. vsce package
```

Output: `oslang-0.1.0.vsix` in the project root.

## Reproducible VSIX packaging

The VSIX is produced with `vsce package` from a clean working tree. `.vscodeignore` excludes `node_modules`, `test`, `package-lock.json`, git metadata, and other repository-only material so the package contains only `package.json`, `language-configuration.json`, `syntaxes/oslang.tmLanguage.json`, `README.md`, `LICENSE`, and `CHANGELOG.md`.

Because ZIP archive timestamps are set by the packager at build time, byte-for-byte reproducibility across runs is not guaranteed by the tooling; package contents and manifest metadata were compared across repeated builds (see the Kilo session report).

## Publisher note

The publisher id declared in the local VSIX is `osb-foundation`. A publisher id in a locally installed VSIX does not prove Marketplace registration or verification. The extension has not been published to any Marketplace.

## Known limitations

- OSLANG keywords are case-insensitive reserved words; an identifier that collides with a keyword (e.g. a variable named `count`, since `COUNT` is a reserved word) is highlighted as the keyword. This matches the language's lexical behavior and cannot be resolved by highlighting alone.
- String interpolation `${...}` is not part of OSLANG 0.8 and receives no special highlighting; `${` outside strings is not classified.
- Date/time literals are highlighted only for the `#YYYY-MM-DD#` and `#HH:MM:SS#` forms; malformed `#...#` constructs receive no special classification.
- Highlighting is lexical (TextMate) only; it is not semantic validation.

## Repository

https://github.com/ygorlazaro/osb-dotnet

## License

MIT (see LICENSE).
