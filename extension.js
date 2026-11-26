'use strict';
const vscode = require('vscode');
const data = require('./completion-data');

function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider('oslang', {
    provideCompletionItems(document, position) {
      const range = document.getWordRangeAtPosition(position);
      const prefix = range ? document.getText(range) : '';
      const items = data.getCompletions(prefix);
      return items.map((it) => {
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
  }, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''));
  context.subscriptions.push(provider);
}

function mapKind(kind) {
  const vscode = require('vscode');
  switch (kind) {
    case 'keyword': return vscode.CompletionItemKind.Keyword;
    case 'type': return vscode.CompletionItemKind.TypeParameter;
    case 'function': return vscode.CompletionItemKind.Function;
    case 'snippet': return vscode.CompletionItemKind.Snippet;
    default: return vscode.CompletionItemKind.Text;
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
