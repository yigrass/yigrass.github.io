// The build copies the portable contract parser beside this module.
import { parseMarkdown } from './markdown-profile.js';
import { create } from '../dom.js';

export function renderMarkdown(text, { root, documents, navigate }) {
  const result = create('div', 'novel-prose');
  function inline(parent, nodes) {
    for (const node of nodes) {
      let element;
      if (node.type === 'image') {
        element = create('img', 'chapter-illustration'); element.src = new URL(node.target.value, root).href; element.alt = node.alt; element.loading = 'lazy';
      } else if (node.type === 'link') {
        const document = documents.find(item => item.file === node.target.value);
        if (node.target.kind === 'local' && !document) { element = create('span'); }
        else {
          element = create('a');
          element.href = document ? navigate(document.id, 'address') : node.target.value;
          if (document) element.addEventListener('click', event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) { event.preventDefault(); navigate(document.id); } });
          else { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
        }
        inline(element, node.children);
      } else if (node.type === 'break') element = create('br');
      else if (node.children) { element = create(node.type === 'strong' ? 'strong' : 'em'); inline(element, node.children); }
      else element = create(node.type === 'code' ? 'code' : 'span', '', node.text);
      parent.append(element);
    }
  }
  for (const node of parseMarkdown(text)) {
    const tags = { paragraph: 'p', quote: 'blockquote', rule: 'hr', pre: 'pre' };
    const element = create(node.type === 'heading' ? `h${node.level}` : node.type === 'list' ? (node.ordered ? 'ol' : 'ul') : tags[node.type]);
    if (node.type === 'list') { if (node.ordered) element.start = node.start; for (const item of node.items) { const li = create('li'); inline(li, item); element.append(li); } }
    else if (node.type === 'pre') element.append(create('code', '', node.text));
    else if (node.children) inline(element, node.children);
    result.append(element);
  }
  return result;
}
