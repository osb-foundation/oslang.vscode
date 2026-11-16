# AGENTS.md — OSLANG VS Code Extension

This file guides coding agents working in the `oslang.vscode` repository.

## Project Identity

**OSLANG VS Code Extension** provides syntax highlighting, IntelliSense, and language support for OSLANG (the scripting language of OSB) in Visual Studio Code.

## Code Policy

1. **Implementation Language**
   - Use **JavaScript** for the extension logic.
   - Use **JSON** for configuration files (package.json, language-configuration.json).
   - Use **YAML/JSON** for syntax highlighting (TextMate grammars).

2. **VS Code Extension API**
   - Follow VS Code extension best practices.
   - Maintain compatibility with supported VS Code versions.
   - Use the Language Server Protocol (LSP) where appropriate.

3. **OSLANG Compatibility**
   - Keep syntax highlighting in sync with OSLANG language versions.
   - Update keywords and built-ins when OSLANG evolves.

## Architecture

The extension includes:

- **extension.js** - Main extension logic
- **language-configuration.json** - Language configuration (brackets, indentation, etc.)
- **package.json** - Extension manifest
- **snippets/** - Code snippets for common patterns
- **syntaxes/** - TextMate grammar for syntax highlighting

## Build and Validation

```bash
# Install dependencies (if needed)
npm install

# Package the extension
vsce package
```

## Change Workflow for Agents

1. Inspect relevant files first.
2. Keep edits targeted.
3. Test syntax highlighting with sample OSLANG files.
4. Update version in package.json when making significant changes.

## Non-Goals and Cautions

- Do not break compatibility with existing OSLANG files.
- Do not introduce external dependencies without need.
- Do not remove language features without updating the grammar.

## Documentation Anchors

- `README.md`: High-level project/user documentation.