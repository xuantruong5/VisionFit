export type InlineMarkdownToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; content: string; url: string };

/**
 * Parse inline Markdown (`**bold**`, `*italic*`, `` `code` ``, `[link](https://...)`) into typed tokens
 * for safe rendering in both chat bubbles and Markdown table cells (no raw asterisks/backticks).
 */
export function parseInlineMarkdown(text: string): InlineMarkdownToken[] {
  if (!text) {
    return [];
  }

  const tokens: InlineMarkdownToken[] = [];
  // Link chỉ chấp nhận http(s) để không mở được scheme nguy hiểm (javascript:, file:, intent:...)
  const pattern = /(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const linkMatch = raw.match(/^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      tokens.push({ type: 'link', content: linkMatch[1], url: linkMatch[2] });
    } else if (raw.startsWith('**') && raw.endsWith('**') && raw.length > 4) {
      tokens.push({ type: 'bold', content: raw.slice(2, -2) });
    } else if (raw.startsWith('`') && raw.endsWith('`') && raw.length > 2) {
      tokens.push({ type: 'code', content: raw.slice(1, -1) });
    } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length > 2) {
      tokens.push({ type: 'italic', content: raw.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', content: raw });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Strip inline Markdown syntax (`**`, `*`, `` ` ``) to plain text for column width
 * estimation and numeric cell alignment checks.
 */
export function stripInlineMarkdown(text: string): string {
  return parseInlineMarkdown(text)
    .map((t) => t.content)
    .join('');
}

