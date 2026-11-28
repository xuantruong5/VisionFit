import { parseInlineMarkdown, stripInlineMarkdown } from '../src/components/mascot/mascotMarkdown';

describe('mascotMarkdown inline parser (UI-01 & UI-04)', () => {
  test('parses bold, italic, and inline code tokens cleanly without leaking markers', () => {
    const tokens = parseInlineMarkdown(
      'BMI **22.68** (*Bình thường* theo chuẩn châu Á) với mã `BMI_OK`.'
    );
    expect(tokens).toEqual([
      { type: 'text', content: 'BMI ' },
      { type: 'bold', content: '22.68' },
      { type: 'text', content: ' (' },
      { type: 'italic', content: 'Bình thường' },
      { type: 'text', content: ' theo chuẩn châu Á) với mã ' },
      { type: 'code', content: 'BMI_OK' },
      { type: 'text', content: '.' },
    ]);
  });

  test('strips bold, italic, and inline code syntax for table width and numeric checks', () => {
    expect(stripInlineMarkdown('22.68 (*Bình thường* theo chuẩn châu Á)')).toBe(
      '22.68 (Bình thường theo chuẩn châu Á)'
    );
    expect(stripInlineMarkdown('**64 kg**')).toBe('64 kg');
    expect(stripInlineMarkdown('`total_sessions`: 12 buổi')).toBe('total_sessions: 12 buổi');
  });

  test('handles empty strings and plain text without syntax safely', () => {
    expect(parseInlineMarkdown('')).toEqual([]);
    expect(parseInlineMarkdown('Lịch tập lúc 07:00')).toEqual([
      { type: 'text', content: 'Lịch tập lúc 07:00' },
    ]);
  });

  test('parses http(s) links (exercise demo GIF / wrong-form video) as clickable tokens', () => {
    const tokens = parseInlineMarkdown(
      '[⚠️ Xem động tác SAI cần tránh](https://fujf.net/assets/exercises/videos/0033-GrO65fd.gif) và **chú ý**'
    );
    expect(tokens).toEqual([
      { type: 'link', content: '⚠️ Xem động tác SAI cần tránh', url: 'https://fujf.net/assets/exercises/videos/0033-GrO65fd.gif' },
      { type: 'text', content: ' và ' },
      { type: 'bold', content: 'chú ý' },
    ]);
    expect(stripInlineMarkdown('Xem [video](https://a.b/c.gif) nhé')).toBe('Xem video nhé');
  });

  test('never turns non-http schemes into links (javascript:, file:, intent:)', () => {
    for (const bad of ['[bấm](javascript:alert(1))', '[mở](file:///etc/passwd)', '[app](intent://x)']) {
      const tokens = parseInlineMarkdown(bad);
      expect(tokens.some((t) => t.type === 'link')).toBe(false);
    }
  });
});

