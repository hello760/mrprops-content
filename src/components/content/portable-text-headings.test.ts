// FIX-CCX regression test (2026-06-10, Sentry MMG-COMMAND-CENTER-X/-Q):
// RegulationView's TOC now renders portableTextHeadings labels VERBATIM.
// This locks the extraction contract: numbered headings ("1. Regulatory
// Overview") must come back exactly as authored — the "N." prefix is part
// of the label — and ids must be preserved/derived stably. If extraction
// ever strips or re-numbers, the TOC would drift from the CC body again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portableTextHeadings } from './PortableTextContent';

test('HTML extraction returns numbered H2 labels verbatim (arizona case)', () => {
  const html = [
    '<h2 id="regulatory-overview">1. Regulatory Overview</h2><p>x</p>',
    '<h2>Airbnb License Requirements Arizona Hosts Should Check</h2><p>y</p>',
    '<h2 id="property-eligibility">3. Property and Building Eligibility</h2><p>z</p>',
  ].join('\n');
  const out = portableTextHeadings(undefined, html);
  assert.deepEqual(out.map((h) => h.label), [
    '1. Regulatory Overview',
    'Airbnb License Requirements Arizona Hosts Should Check',
    '3. Property and Building Eligibility',
  ]);
  assert.equal(out[0].id, 'regulatory-overview'); // explicit id captured (FIX-CCX regex fix)
  assert.ok(out[1].id.length > 0); // derived id non-empty
});

test('HTML with inline tags inside H2 strips tags but keeps text', () => {
  const out = portableTextHeadings(undefined, '<h2><strong>2.</strong> Tax Obligations</h2>');
  assert.equal(out.length, 1);
  assert.equal(out[0].label, '2. Tax Obligations');
});

test('no H2s -> empty array (TOC card is gated on length > 0)', () => {
  assert.deepEqual(portableTextHeadings(undefined, '<p>no headings here</p>'), []);
  assert.deepEqual(portableTextHeadings(undefined, undefined), []);
});
