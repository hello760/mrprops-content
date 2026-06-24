/**
 * Tests for the /regulations "Compliance Checklist" relocation helpers.
 * Run: npx tsx --test src/lib/markdown-to-html.test.ts
 *
 * The critical guarantee (blast-radius fix): stripRedundantBodyBlocks only
 * removes the "…Compliance Checklist" section when the caller opts in via
 * { relocateComplianceChecklist: true }. Without the flag the section is kept,
 * so the 5 non-RegulationView consumers (TaxView, Guide, Glossary, LeadGen,
 * glossary route) never silently drop content.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stripRedundantBodyBlocks,
  extractComplianceChecklistSection,
  firstHeadingText,
} from "./markdown-to-html.js";

const BODY =
  '<h2>Tennessee Airbnb Compliance Checklist</h2>' +
  '<ul><li><p>☐ Confirm registration</p></li><li><p>☐ Install detectors</p></li></ul>' +
  '<h2>1. Regulatory Overview</h2><p>Operators face three levels.</p>' +
  '<h2>Disclaimer</h2><p>Not legal advice.</p>';

const BODY_STRONG =
  '<h2><strong>The Lima Airbnb Compliance Checklist</strong></h2>' +
  '<ul><li><p>☐ Register on Ejaraat</p></li></ul>' +
  '<h2>1. Regulatory Overview</h2><p>Body.</p>';

test("extract returns the checklist section (with the box glyphs)", () => {
  const ex = extractComplianceChecklistSection(BODY);
  assert.ok(ex.includes("Compliance Checklist"));
  assert.equal((ex.match(/☐/g) || []).length, 2);
  assert.ok(!ex.includes("Regulatory Overview"));
});

test("OPT-IN strip removes the checklist, keeps the rest", () => {
  const out = stripRedundantBodyBlocks(BODY, { relocateComplianceChecklist: true });
  assert.ok(!out.includes("Compliance Checklist"));
  assert.equal((out.match(/☐/g) || []).length, 0);
  assert.ok(out.includes("Regulatory Overview"));
  assert.ok(out.includes("Disclaimer"));
});

test("DEFAULT (no flag) does NOT strip the checklist — blast-radius guarantee", () => {
  const out = stripRedundantBodyBlocks(BODY);
  assert.ok(out.includes("Compliance Checklist"), "section must survive for non-regulation callers");
  assert.equal((out.match(/☐/g) || []).length, 2, "all boxes preserved");
});

test("extract + opt-in-strip is lossless (covers the whole body, no overlap)", () => {
  const ex = extractComplianceChecklistSection(BODY);
  const out = stripRedundantBodyBlocks(BODY, { relocateComplianceChecklist: true });
  assert.equal(ex.length + out.length, BODY.length);
});

test("firstHeadingText strips inner <strong>", () => {
  assert.equal(firstHeadingText(BODY), "Tennessee Airbnb Compliance Checklist");
  assert.equal(firstHeadingText(BODY_STRONG), "The Lima Airbnb Compliance Checklist");
  assert.equal(firstHeadingText(""), "");
  assert.equal(firstHeadingText(null), "");
});

test("<strong>-wrapped checklist heading is still stripped (opt-in) and extracted", () => {
  assert.ok(extractComplianceChecklistSection(BODY_STRONG).includes("Compliance Checklist"));
  const out = stripRedundantBodyBlocks(BODY_STRONG, { relocateComplianceChecklist: true });
  assert.ok(!out.includes("Compliance Checklist"));
  assert.ok(out.includes("Regulatory Overview"));
});
