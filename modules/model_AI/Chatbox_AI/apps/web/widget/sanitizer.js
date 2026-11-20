/**
 * VisionFit Safe Message Formatter & Sanitizer
 * Định dạng Markdown an toàn (bold, italic, code, list, tables, safe links)
 * Tuyệt đối không dùng innerHTML trực tiếp với nội dung AI.
 * Chặn hoàn toàn script, HTML độc hại và link javascript:.
 */

/**
 * Thoát các ký tự HTML nguy hiểm
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Kiểm tra URL an toàn (chỉ chấp nhận http/https, từ chối javascript:, data:, vbscript:)
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeURL(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

/**
 * Render Markdown giới hạn an toàn thành DOM DocumentFragment
 * @param {string} text - Nội dung thô từ AI hoặc User
 * @returns {DocumentFragment}
 */
export function renderSafeMessage(text) {
  const fragment = document.createDocumentFragment();
  if (!text || typeof text !== 'string') return fragment;

  // Bước 1: Thoát HTML trước tiên
  const escaped = escapeHTML(text);

  // Phân tách từng dòng để xử lý danh sách, bảng và đoạn văn
  const lines = escaped.split(/\r?\n/);
  let currentList = null;
  let isOrderedList = false;

  const isPipeRow = (l) => {
    const t = l.trim();
    return t.includes('|') && (t.startsWith('|') || t.endsWith('|') || t.split('|').length >= 3);
  };
  const isSepRow = (l) => {
    const t = l.trim();
    return t.includes('|') && /^\|?[\s:\-+|]+\|?$/.test(t) && t.includes('-');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 0. Kiểm tra Markdown Table đàn hồi (không kẹt khi có dòng trống hoặc dấu pipe thiếu)
    if (isPipeRow(trimmed)) {
      let sepIdx = -1;
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        if (!lines[j].trim()) continue;
        if (isSepRow(lines[j].trim())) { sepIdx = j; break; }
        break;
      }

      if (sepIdx !== -1) {
        currentList = null;
        const wrap = document.createElement('div');
        wrap.className = 'vif-table-wrapper';
        const table = document.createElement('table');
        table.className = 'vif-table';

        const thead = document.createElement('thead');
        const headerTr = document.createElement('tr');
        const rawHeader = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
        const cleanHeader = rawHeader.endsWith('|') ? rawHeader.slice(0, -1) : rawHeader;
        const headers = cleanHeader.split('|').map(c => c.trim().replace(/\*\*/g, ''));
        headers.forEach(h => {
          const th = document.createElement('th');
          th.innerHTML = formatInlineMarkdown(h);
          headerTr.appendChild(th);
        });
        thead.appendChild(headerTr);
        table.appendChild(thead);

        i = sepIdx;
        const tbody = document.createElement('tbody');
        while (i + 1 < lines.length) {
          const nextTrim = lines[i + 1].trim();
          if (!nextTrim) { i++; continue; }
          if (isPipeRow(nextTrim) && !isSepRow(nextTrim)) {
            i++;
            const rawRow = nextTrim.startsWith('|') ? nextTrim.slice(1) : nextTrim;
            const cleanRow = rawRow.endsWith('|') ? rawRow.slice(0, -1) : rawRow;
            const rowCells = cleanRow.split('|').map(c => c.trim());
            const tr = document.createElement('tr');
            rowCells.forEach(cell => {
              const td = document.createElement('td');
              td.innerHTML = formatInlineMarkdown(cell);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          } else {
            break;
          }
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        fragment.appendChild(wrap);
        continue;
      }
    }

    // Kiểm tra dòng kẻ phân cách: "---", "***", "___"
    if (/^[-*_]{3,}$/.test(trimmed)) {
      currentList = null;
      const hr = document.createElement('hr');
      hr.className = 'vif-divider';
      fragment.appendChild(hr);
      continue;
    }

    // Kiểm tra dòng tiêu đề Markdown: "# ", "## ", "### ", v.v. -> Đổi thành -
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
    if (headingMatch) {
      currentList = null;
      const level = headingMatch[1].length;
      const h = document.createElement('div');
      h.className = `vif-heading vif-h${level}`;
      h.innerHTML = `- ` + formatInlineMarkdown(headingMatch[2]);
      fragment.appendChild(h);
      continue;
    }

    // Kiểm tra dòng danh sách không thứ tự: "- " hoặc "* "
    const isUlItem = /^[-*]\s+(.*)$/.test(trimmed);
    // Kiểm tra dòng danh sách có thứ tự: "1. ", "2. ", v.v.
    const isOlItem = /^(\d+)\.\s+(.*)$/.test(trimmed);

    if (isUlItem || isOlItem) {
      const match = isUlItem ? trimmed.match(/^[-*]\s+(.*)$/) : trimmed.match(/^(\d+)\.\s+(.*)$/);
      const content = match ? match[1] || match[2] : trimmed;

      if (!currentList || (isUlItem && isOrderedList) || (isOlItem && !isOrderedList)) {
        currentList = document.createElement(isUlItem ? 'ul' : 'ol');
        currentList.className = 'vif-msg-list';
        fragment.appendChild(currentList);
        isOrderedList = isOlItem;
      }

      const li = document.createElement('li');
      li.innerHTML = formatInlineMarkdown(content);
      currentList.appendChild(li);
    } else {
      currentList = null;

      if (trimmed === '') {
        // Dòng trống -> thêm khoảng cách nhẹ
        const spacer = document.createElement('div');
        spacer.className = 'vif-msg-spacer';
        fragment.appendChild(spacer);
      } else {
        const p = document.createElement('p');
        p.className = 'vif-msg-p';
        p.innerHTML = formatInlineMarkdown(rawLine);
        fragment.appendChild(p);
      }
    }
  }

  return fragment;
}

/**
 * Định dạng các thẻ inline an toàn (đã được escapeHTML trước đó)
 * @param {string} escapedText
 * @returns {string}
 */
export function formatInlineMarkdown(escapedText) {
  let result = escapedText;

  // 1. Inline code: `code`
  result = result.replace(/`([^`]+)`/g, '<code class="vif-inline-code">$1</code>');

  // 2. Bold: **text** hoặc __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 3. Italic: *text* hoặc _text_
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 4. Safe links: [label](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    // Giải mã url đã escape để kiểm tra tính an toàn
    const unescapedUrl = url.replace(/&amp;/g, '&');
    if (isSafeURL(unescapedUrl)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="vif-msg-link">${label} ↗</a>`;
    }
    // Nếu URL không an toàn, chỉ hiển thị label text thuần
    return label;
  });

  return result;
}
