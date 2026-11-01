import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, isSafeURL, formatInlineMarkdown } from '../../apps/web/widget/sanitizer.js';
import { ALLOWED_NAVIGATION_TARGETS } from '../../apps/web/widget/adapter.js';

test('escapeHTML escapes special HTML entities preventing injection', () => {
  assert.equal(escapeHTML('<b>Hello</b>'), '&lt;b&gt;Hello&lt;/b&gt;');
  assert.equal(escapeHTML('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHTML("Don't & Stop"), 'Don&#039;t &amp; Stop');
});

test('isSafeURL accepts http/https and rejects dangerous protocols', () => {
  assert.ok(isSafeURL('https://visionfit.vn/terms'));
  assert.ok(isSafeURL('http://localhost:3000'));
  assert.equal(isSafeURL('javascript:alert(1)'), false);
  assert.equal(isSafeURL('data:text/html,<script>'), false);
  assert.equal(isSafeURL('vbscript:msgbox(1)'), false);
  assert.equal(isSafeURL(''), false);
});

test('formatInlineMarkdown converts **bold**, *italic*, `code` and safe links without raw asterisks', () => {
  const boldRaw = escapeHTML('Tập **3 hiệp** mỗi ngày');
  const boldFormatted = formatInlineMarkdown(boldRaw);
  assert.ok(boldFormatted.includes('<strong>3 hiệp</strong>'));
  assert.equal(boldFormatted.includes('**'), false, 'Must not leave raw double asterisks');

  const italicRaw = escapeHTML('Rất *tuyệt vời*');
  assert.ok(formatInlineMarkdown(italicRaw).includes('<em>tuyệt vời</em>'));

  const codeRaw = escapeHTML('Chạy lệnh `npm test`');
  assert.ok(formatInlineMarkdown(codeRaw).includes('<code class="vif-inline-code">npm test</code>'));

  const linkRaw = escapeHTML('Xem [Trang chủ](https://visionfit.vn)');
  assert.ok(formatInlineMarkdown(linkRaw).includes('<a href="https://visionfit.vn"'));

  const badLinkRaw = escapeHTML('Bấm [Hack](javascript:alert(1))');
  assert.equal(formatInlineMarkdown(badLinkRaw).includes('<a href='), false, 'Dangerous javascript: link must not become clickable anchor');
  assert.ok(formatInlineMarkdown(badLinkRaw).includes('Hack'));
});

test('ALLOWED_NAVIGATION_TARGETS enforces strict allowlist', () => {
  assert.ok(ALLOWED_NAVIGATION_TARGETS.includes('workout'));
  assert.ok(ALLOWED_NAVIGATION_TARGETS.includes('schedule'));
  assert.ok(ALLOWED_NAVIGATION_TARGETS.includes('packages'));
  assert.ok(ALLOWED_NAVIGATION_TARGETS.includes('profile'));
  assert.ok(ALLOWED_NAVIGATION_TARGETS.includes('dashboard'));
  assert.equal(ALLOWED_NAVIGATION_TARGETS.includes('admin/delete_database'), false);
  assert.equal(ALLOWED_NAVIGATION_TARGETS.includes('https://external-malicious-site.com'), false);
});
