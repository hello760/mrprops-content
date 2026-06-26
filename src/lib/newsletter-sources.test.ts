import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VALID_NEWSLETTER_SOURCES, normalizeNewsletterSource } from './newsletter-sources';

test('regulations_sidebar is now an accepted source (was misattributed to footer)', () => {
  assert.ok(VALID_NEWSLETTER_SOURCES.has('regulations_sidebar'));
  assert.equal(normalizeNewsletterSource('regulations_sidebar'), 'regulations_sidebar');
});

test('all existing CTA/footer sources remain accepted', () => {
  for (const s of ['footer','guides_cta','tools_cta','regulations_cta','taxes_cta','glossary_cta','templates_cta','alternatives_cta','compare_cta','manual']) {
    assert.equal(normalizeNewsletterSource(s), s);
  }
});

test('unknown / non-string source falls back to footer (behaviour preserved)', () => {
  assert.equal(normalizeNewsletterSource('bogus'), 'footer');
  assert.equal(normalizeNewsletterSource(undefined), 'footer');
  assert.equal(normalizeNewsletterSource(123 as unknown), 'footer');
  assert.equal(normalizeNewsletterSource(null), 'footer');
});
