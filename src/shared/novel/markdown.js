import { parseMarkdown } from './parser.js';
import { create } from '../dom.js';

export function renderMarkdown(text, { root, documents, navigate }) {
  const result = create('div', 'novel-prose');
  // markdown-it owns all syntax parsing; this adapter creates DOM nodes and
  // connects published-document links to the existing desktop window.
  function render(parent, tokens) {
    const stack = [parent];
    for (const token of tokens) {
      if (token.hidden) continue;
      if (token.type === 'inline') { render(stack.at(-1), token.children); continue; }
      if (token.nesting === -1) { stack.pop(); continue; }
      let element;
      if (token.type === 'text' || token.type === 'softbreak') element = create('span', '', token.type === 'softbreak' ? '\n' : token.content);
      else if (token.type === 'fence' || token.type === 'code_block') { element = create('pre'); element.append(create('code', token.info ? `language-${token.info.split(/\s/)[0]}` : '', token.content)); }
      else if (token.type === 'code_inline') element = create('code', '', token.content);
      else if (token.type === 'image') {
        element = create('img', 'chapter-illustration'); element.src = new URL(token.attrGet('src'), root).href;
        element.alt = token.content; element.loading = 'lazy'; element.draggable = false;
      } else {
        element = create(token.tag || 'span');
        for (const [key, value] of token.attrs || []) element.setAttribute(key, value);
        if (token.tag === 'a') {
          const target = new URL(token.attrGet('href'), root);
          const linkedDocument = documents.find(item => new URL(item.file, root).href === target.href.split('#')[0]);
          element.href = linkedDocument ? navigate(linkedDocument.id, 'address') + target.hash : target.href;
          if (linkedDocument) element.addEventListener('click', event => {
            if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) { event.preventDefault(); navigate(linkedDocument.id); }
          });
          else if (target.origin !== root.origin) { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
        }
      }
      stack.at(-1).append(element);
      if (token.nesting === 1) stack.push(element);
    }
  }
  render(result, parseMarkdown(text));
  return result;
}
