# OSLANG - VS Code / VSCodium Extension

Syntax highlighting, editor configuration, and **context-aware IntelliSense** for **OSLANG 0.8**, the scripting language of OSB, in Visual Studio Code and VSCodium.

## Scope

This extension provides **language recognition, editor configuration, syntax highlighting, and IntelliSense**:

- Automatic file association for `.osl` files (language id: `oslang`)
- Syntax highlighting based on the OSLANG 0.8 lexical grammar (keywords, types, operators, numeric/string/date-time literals, booleans, null, comments)
- Editor configuration: line and block comments, brackets, auto-closing/surrounding pairs, indentation rules
- Static autocomplete (keywords, types, standard-library functions, namespaces, construct snippets)
- Context-aware, scope-aware completion (variables, functions, parameters visible at the cursor)
- Dot-triggered member completion for primitives (string, array) and namespaces (`MATH`, `DATE`, `TIME`)
- Function signature assistance with parameter names and active-parameter detection

It does **not** provide hover, document symbols, folding, a language server, a parser, compilation, execution, diagnostics, or a debugger. Those features belong to other roadmap cards.

## Supported language version

OSLANG 0.8 (syntax preserved from OSLANG 0.73; OSLANG 0.8 introduces no syntax changes). File extension: `.osl`.

The extension's own version (`0.1.4`) is independent of the OSLANG language version.

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

### Static autocomplete

Triggered while typing letters and after `.`. Offers, filtered by the current word prefix:

- Keywords and reserved words
- Types (`NUMBER`, `STRING`, `BOOLEAN`, `BOOL`, `OBJECT`, `ARRAY`)
- Standard-library functions (`STR`, `NUMBER`, `BOOL`, `COUNT`, `TYPEOF`, `LEFT`, `RIGHT`, `INSERT`, `REMOVE`, `REPEAT`, `TOUPPER`, `TOLOWER`, `TRIM`, `DATE`, `TIME`)
- Namespaces (`MATH`, `DATE`, `TIME`, `FILE`, `DIR`, `OSL`, `OSB`)
- Construct snippets (`FUNCTION ... END FUNCTION`, `IF ... END IF`, `FOR ... NEXT`, `WHILE ... END WHILE`, `CLASS ... END CLASS`, `TRY ... CATCH ... END TRY`, `SWITCH ... END SWITCH`)

### Context-aware autocomplete

Completion is augmented with symbols visible at the cursor, derived from a lightweight single-file scope analysis (no full parser):

- Variables declared with `VAR` / `GLOBAL` / `DIM`, visible from their declaration point onward
- Function parameters, visible inside the function body
- Functions (including forward references declared later in the file)
- Block scoping for `IF` / `FOR` / `WHILE` / `DO` / `TRY` / `SWITCH` / `CLASS` / `FUNCTION`, with inner declarations shadowing outer ones

### Scope-aware suggestions

- A variable declared after the cursor is not suggested.
- A variable declared in an inner block shadows an outer variable of the same name.
- Parameters are visible only within their function body.
- Functions are visible globally, including calls that appear before their declaration.

### Dot-triggered member completion

Typing `.` after a receiver offers members for that receiver's type. The receiver type is inferred from the expression before the dot:

| Receiver | Members offered |
| --- | --- |
| String literal (`"..."`) or `VAR s STRING` | `TOUPPER`, `TOLOWER`, `LENGTH`, `COUNT`, `SUBSTRING`, `SUBSTR`, `INDEXOF`, `TRIM` |
| `VAR a ARRAY` | `COUNT`, `FIRST`, `LAST`, `PUSH`, `POP`, `CLEAR`, `CONTAINS`, `REMOVEAT`, `INSERTAT` |
| `MATH` | `PI`, `E`, `SQRT`, `ABS`, `POW`, `FLOOR`, `CEIL`, `ROUND`, `TRUNC`, `SIN`, `COS`, `TAN`, `ASIN`, `ACOS`, `ATAN`, `LOG`, `LOG10`, `EXP`, `SIGN`, `MIN`, `MAX`, `CLAMP`, `MOD`, `RANDOM` |
| `DATE` | `NOW`, `YEAR`, `MONTH`, `DAY`, `DAYOFWEEK` |
| `TIME` | `NOW`, `HOUR`, `MINUTE`, `SECOND` |
| Number literal or `VAR n NUMBER` | *(none — the engine has no number method dispatchers)* |
| `TRUE` / `FALSE` or `VAR b BOOLEAN` | *(none — the engine has no boolean method dispatchers)* |
| `FILE`, `DIR`, `OSL`, `OSB` | *(recognized as namespaces, but no members are defined; the engine delegates to providers)* |

Parameterised methods insert a snippet (for example `SQRT(${1:x})`, `SUBSTRING(${1:start}, ${2:length})`). After the dot, a typed prefix filters the list (`MATH.S` → `SQRT`, `SIN`, `SIGN`).

### Function signature assistance

Triggered by `(` and `,`. Shows a signature with parameter names and highlights the active parameter:

- **User functions** — `Add(a, b)` → `ADD(A, B)`; parameters are read from the declaration (forward references resolved by a full-file scan).
- **Standard library** — `STR(` → `STR(value)`; `LEFT(s, ` → `LEFT(s, n)` with active parameter 1.
- **Namespaces** — `MATH.SQRT(` → `MATH.SQRT(x)`; `MATH.POW(x, ` → active parameter 1; `MATH.CLAMP(x, min, ` → active parameter 2.

Active-parameter detection is depth-aware: commas inside nested calls are not counted, so `Foo(bar(a, b), c)` reports active parameter 1.

Parameter **names** are shown in the signature. Parameter **types** are parsed from `AS type` / `: type` clauses and `VAR name TYPE` declarations and are used to infer receiver types for member completion; they are not rendered in the signature label.

### Ctrl+Space

VS Code's native **Ctrl+Space** invokes completion without a trigger character. The extension returns the scope-visible symbols (variables, functions, parameters). When the cursor is immediately after a `.`, it returns the prefix-filtered member list for the receiver instead.

## Supported contexts and known limitations

- Member completion is a lexical, single-file heuristic: the receiver is the expression before the last `.` on the cursor line. It is not a full semantic parser.
- Type inference is limited to explicit `VAR name TYPE` declarations and literals; there is no type propagation through assignments.
- `NUMBER` and `BOOLEAN` have no method dispatchers in the engine, so no members are offered for them.
- `FILE`, `DIR`, `OSL`, `OSB` are recognized as namespaces but expose no members (the engine delegates to host providers).
- Signature help is defined for user functions, the standard-library functions `STR`, `NUMBER`, `BOOL`, `COUNT`, `TYPEOF`, `LEFT`, `RIGHT`, `TOUPPER`, `TOLOWER`, `TRIM`, and the `MATH` / `DATE` / `TIME` namespace methods. Other standard-library names (`INSERT`, `REMOVE`, `REPEAT`, `DATE`, `TIME`) are offered as completions but have no signature entry.
- Signature labels show parameter names only (see above).
- Highlighting is lexical (TextMate) only; it is not semantic validation.

## Installation from a VSIX package

1. Obtain the VSIX (see "Building" below), e.g. `oslang-0.1.4.vsix`.
2. Install it into an isolated editor profile so it does not interfere with your existing extensions:

   Visual Studio Code:
   ```bash
   code --install-extension oslang-0.1.4.vsix --user-data-dir /tmp/kilo/vscode-oslang
   ```

   VSCodium:
   ```bash
   codium --install-extension oslang-0.1.4.vsix --user-data-dir /tmp/kilo/vscodium-oslang
   ```
3. Open or create a `.osl` file. The OSLANG language mode activates automatically and syntax highlighting and IntelliSense apply.

### Updating

Uninstall the previous version, then install the new VSIX with the same `--install-extension` command. The extension version (`0.1.4`) is independent of the OSLANG language version (0.8).

## Usage examples

### Dot-triggered member completion (namespaces)

```oslang
VAR root NUMBER
root = MATH.SQRT(16)        ' type "MATH." then pick SQRT; signature shows SQRT(x)
PRINT MATH.PI
PRINT MATH.CLAMP(5, 0, 10)  ' signature tracks active parameter 1, 2, 3
```

### Dot-triggered member completion (primitives)

```oslang
VAR message STRING
message = "Hello"
PRINT message.TOUPPER()          ' -> HELLO
PRINT message.LENGTH             ' code-point count
PRINT message.SUBSTRING(0, 5)    ' snippet: SUBSTRING(start, length)

VAR items ARRAY
items.PUSH(1)
items.PUSH(2)
PRINT items.COUNT
PRINT items.FIRST
```

### Scope-aware completion and signature help

```oslang
FUNCTION Add(a, b)
    RETURN a + b
END FUNCTION

VAR total NUMBER
total = Add(1, 2)   ' typing "Add(" shows ADD(A, B); active parameter advances on ","
PRINT total
```

### Ctrl+Space

Place the cursor inside a function body and press **Ctrl+Space** to list the variables, parameters, and functions visible at that point.

## Specification and source traceability

The IntelliSense data is derived from the actual OSLANG engine implementation (source of truth), not from prose specifications. The table below records, for each surfaced feature, the authoritative engine source that defines the behaviour. Where the engine exposes no behaviour, the extension offers nothing and this is stated explicitly.

| Extension feature | Authoritative engine source | Symbol / evidence |
| --- | --- | --- |
| String members (`TOUPPER`, `TOLOWER`, `LENGTH`/`COUNT`, `SUBSTRING`/`SUBSTR`, `INDEXOF`, `TRIM`) | `osb.oslang/engine/Core/Eval/StringMethods.cs` | `StringMethods.Call` switch |
| Array members (`COUNT`, `FIRST`, `LAST`, `PUSH`, `POP`, `CLEAR`, `CONTAINS`, `REMOVEAT`, `INSERTAT`) | `osb.oslang/engine/Core/Eval/ArrayMethods.cs` | `ArrayMethods.Call` switch |
| `MATH` members (`PI`, `E`, `SQRT` … `RANDOM`) | `osb.oslang/engine/Core/Eval/MathNamespace.cs` | `MathNamespace.Call` switch |
| `DATE` / `TIME` members (`NOW`, `YEAR` … `SECOND`) | `osb.oslang/engine/Core/Eval/DateTimeNamespace.cs` | `DateTimeNamespace.Call` switch |
| Standard-library functions and signatures (`STR`, `NUMBER`, `BOOL`, `COUNT`, `TYPEOF`, `LEFT`, `RIGHT`, `TOUPPER`, `TOLOWER`, `TRIM`) | `osb.oslang/engine/Core/Eval/StandardLibrary.cs` | `StandardLibrary.TryCall` |
| Namespace dispatch for `MATH` / `DATE` / `TIME` | `osb.oslang/engine/Core/Eval/StandardLibrary.cs` | `StandardLibrary.TryCallNamespace` |
| No number/boolean members | `osb.oslang/engine/Core/Eval/` | No `NumberMethods` / `BooleanMethods` dispatchers exist |

Notes on fidelity:

- The engine's date/time dispatcher (`DateTimeNamespace.Call`) is shared by the `DATE` and `TIME` namespaces; the extension presents a semantic grouping (date components under `DATE`, time components under `TIME`).
- Member and signature sets are curated to exactly the labels the engine dispatches on; no member or signature is offered that the engine does not implement.
- The grammar and editor behaviour follow the OSLANG 0.8 specification (`osb.oslang/OSLANG-0.8-SPEC.md`; syntax preserved from 0.73 — 0.8 adds no syntax).

## Supported editors

- Visual Studio Code (engine `^1.80.0` declared in package.json)
- VSCodium (validated with VSCodium 1.143.x in this environment)

Visual Studio Code was not available in the validation environment; only VSCodium was installed and tested.

## Building and testing

Prerequisites: Node.js (v24 used for validation, via NVM) and npm.

```bash
# Install locked development dependencies (test tooling + vsce packager)
npm install

# Run the full test suite (tokenize, completion, context, members)
npm test

# Package the VSIX
npm run package   # i.e. vsce package
```

Output: `oslang-0.1.4.vsix` in the project root.

## Reproducible VSIX packaging

The VSIX is produced with `vsce package` from a clean working tree. `.vscodeignore` excludes `node_modules`, `test`, `package-lock.json`, git metadata, `AGENTS.md`, and other repository-only material so the package contains only `package.json`, `language-configuration.json`, `syntaxes/oslang.tmLanguage.json`, `README.md`, `LICENSE`, and `CHANGELOG.md`.

Because ZIP archive timestamps are set by the packager at build time, byte-for-byte reproducibility across runs is not guaranteed by the tooling; package contents and manifest metadata were compared across repeated builds.

## Publisher note

The publisher id declared in the local VSIX is `osb-foundation`. A publisher id in a locally installed VSIX does not prove Marketplace registration or verification. The extension has not been published to any Marketplace.

## Known limitations

- OSLANG keywords are case-insensitive reserved words; an identifier that collides with a keyword (e.g. a variable named `count`, since `COUNT` is a reserved word) is highlighted as the keyword. This matches the language's lexical behavior and cannot be resolved by highlighting alone.
- String interpolation `${...}` is not part of OSLANG 0.8 and receives no special highlighting; `${` outside strings is not classified.
- Date/time literals are highlighted only for the `#YYYY-MM-DD#` and `#HH:MM:SS#` forms; malformed `#...#` constructs receive no special classification.
- Highlighting is lexical (TextMate) only; it is not semantic validation.
- IntelliSense is a single-file, lexical analysis; it does not resolve across files or perform full type inference (see "Supported contexts and known limitations").

## Repository

https://github.com/ygorlazaro/osb-dotnet

## License

MIT (see LICENSE).