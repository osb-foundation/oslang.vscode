'use strict';
const vscode = require('vscode');
const data = require('./completion-data');
const analyzer = require('./analyzer');

function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider('oslang', {
    provideCompletionItems(document, position) {
      const offset = document.offsetAt(position);
      const text = document.getText();
      const range = document.getWordRangeAtPosition(position);
      const prefix = range ? document.getText(range) : '';
      // member completion after dot: not supported reliably
      const charBefore = offset > 0 ? text.charAt(offset - 1) : '';
      if (charBefore === '.') return [];

      const staticItems = data.getCompletions(prefix);
      const ctxItems = analyzer.getContextCompletions(text, offset);
      // dedup by label
      const seen = new Set(staticItems.map(i => i.label.toUpperCase()));
      const merged = staticItems.slice();
      for (const ci of ctxItems) {
        if (seen.has(ci.label.toUpperCase())) continue;
        seen.add(ci.label.toUpperCase());
        merged.push({ label: ci.label, kind: ci.kind === 'function' ? 'function' : 'variable', detail: ci.detail, insertText: ci.label, snippet: false });
      }
      return merged.map((it) => {
        const ci = new vscode.CompletionItem(it.label, mapKind(it.kind));
        ci.detail = it.detail;
        if (it.snippet) {
          ci.insertText = new vscode.SnippetString(it.insertText);
        } else {
          ci.insertText = it.insertText;
        }
        return ci;
      });
    }
  }, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.'.split(''));
  context.subscriptions.push(provider);
}

function mapKind(kind) {
  const vscode = require('vscode');
  switch (kind) {
    case 'keyword': return vscode.CompletionItemKind.Keyword;
    case 'type': return vscode.CompletionItemKind.TypeParameter;
    case 'function': return vscode.CompletionItemKind.Function;
    case 'variable': return vscode.CompletionItemKind.Variable;
    case 'snippet': return vscode.CompletionItemKind.Snippet;
    default: return vscode.CompletionItemKind.Text;
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
