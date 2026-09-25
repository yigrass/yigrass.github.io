import MarkdownIt from 'markdown-it';

// Same parser family as VS Code; site styling and supported plugins remain independent.
export const markdown = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false });
export const parseMarkdown = text => markdown.parse(text, {});
export function headingTitle(text) {
  const tokens = parseMarkdown(text);
  const index = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
  if (index < 0) return ''; // No guessed title and no producer-content validation.
  return (tokens[index + 1]?.children || []).map(token => token.type === 'softbreak' || token.type === 'hardbreak' ? ' ' : token.nesting === 0 ? token.content : '').join('');
}
