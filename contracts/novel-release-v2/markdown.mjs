// Deliberately small Markdown profile, shared by the validator and browser build.
// No raw HTML, executable URLs, reference links, tables or extension plugins.
export function destination(value) {
  if (/^https?:\/\//i.test(value)) {
    try { const url = new URL(value); return !url.username && !url.password ? { kind: 'external', value: url.href } : null; } catch { return null; }
  }
  if (!/^(?:[a-zA-Z0-9][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) return null;
  return { kind: 'local', value };
}
export function inline(source, depth = 0) {
  if (depth > 12) return [{ type: 'text', text: source }];
  const nodes = [];
  const push = text => { if (text) { if (nodes.at(-1)?.type === 'text') nodes.at(-1).text += text; else nodes.push({ type: 'text', text }); } };
  while (source) {
    let match;
    if ((match = /^\\([\\`*_[\]{}()#+.!>~-])/.exec(source))) { push(match[1]); source = source.slice(match[0].length); continue; }
    if ((match = /^`([^`\n]+)`/.exec(source))) { nodes.push({ type: 'code', text: match[1] }); source = source.slice(match[0].length); continue; }
    if ((match = /^(!?)\[([^\]\n]+)\]\(([^\s()]+)\)/.exec(source))) {
      const target = destination(match[3]);
      if (target && (!match[1] || target.kind === 'local' && /^images\/.+\.(png|jpg|jpeg|webp)$/.test(target.value))) {
        nodes.push(match[1] ? { type: 'image', alt: match[2], target } : { type: 'link', children: inline(match[2], depth + 1), target });
      } else push(match[0]);
      source = source.slice(match[0].length); continue;
    }
    if ((match = /^(\*\*|__)(?=\S)(.+?)\1/.exec(source))) { nodes.push({ type: 'strong', children: inline(match[2], depth + 1) }); source = source.slice(match[0].length); continue; }
    if ((match = /^(\*|_)(?=\S)([^\n]+?)\1/.exec(source))) { nodes.push({ type: 'em', children: inline(match[2], depth + 1) }); source = source.slice(match[0].length); continue; }
    if ((match = /^ {2,}\n/.exec(source))) { nodes.push({ type: 'break' }); source = source.slice(match[0].length); continue; }
    push(source[0]); source = source.slice(1);
  }
  return nodes;
}
export function parseMarkdown(text) {
  const lines = text.replace(/\r\n?/g, '\n').trim().split('\n'), nodes = [];
  const boundary = line => /^(?:#{1,6}\s|```|~~~|>\s?|\s*[-*+]\s|\s*\d+\.\s|(?:---+|\*\*\*+|___+)\s*$)/.test(line);
  for (let i = 0; i < lines.length;) {
    const line = lines[i]; let match;
    if (!line.trim()) { i++; continue; }
    if ((match = /^(#{1,6})\s+(.+)$/.exec(line))) { nodes.push({ type: 'heading', level: match[1].length, children: inline(match[2]) }); i++; }
    else if ((match = /^(`{3,}|~{3,})(.*)$/.exec(line))) {
      const fence = match[1], content = []; i++;
      while (i < lines.length && !new RegExp(`^${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) content.push(lines[i++]);
      if (i < lines.length) i++;
      nodes.push({ type: 'pre', text: content.join('\n') });
    } else if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) { nodes.push({ type: 'rule' }); i++; }
    else if (/^>\s?/.test(line)) {
      const content = []; while (i < lines.length && /^>\s?/.test(lines[i])) content.push(lines[i++].replace(/^>\s?/, ''));
      // A quote is a paragraph in this profile; nested block parsing is intentionally excluded.
      nodes.push({ type: 'quote', children: inline(content.join('\n')) });
    } else if ((match = /^\s*([-*+]|\d+\.)\s+(.+)$/.exec(line))) {
      const ordered = /\d/.test(match[1]), items = [], start = ordered ? Number.parseInt(match[1], 10) : 1;
      while (i < lines.length) { const item = /^\s*([-*+]|\d+\.)\s+(.+)$/.exec(lines[i]); if (!item || /\d/.test(item[1]) !== ordered) break; items.push(inline(item[2])); i++; }
      nodes.push({ type: 'list', ordered, start, items });
    } else {
      const content = [lines[i++]]; while (i < lines.length && lines[i].trim() && !boundary(lines[i])) content.push(lines[i++]);
      nodes.push({ type: 'paragraph', children: inline(content.join('\n')) });
    }
  }
  return nodes;
}
export function references(nodes) {
  const found = [];
  function visit(node) { if (node.target) found.push({ ...node.target, type: node.type }); for (const child of node.children || []) visit(child); for (const item of node.items || []) item.forEach(visit); }
  nodes.forEach(visit); return found;
}
