import test from 'node:test';
import assert from 'node:assert/strict';
import { planPdfPages } from '../src/app/lib/missionPdfPagination.ts';

test('cuts between text lines and preserves every pixel of long answers', () => {
  const lines = Array.from({ length: 130 }, (_, i) => ({ start: i * 23 + 2, end: i * 23 + 20 }));
  const pages = planPdfPages(3000, 980, lines, [{ start: 0, end: 2990 }]);
  assert.equal(pages[0].start, 0);
  assert.equal(pages.at(-1).end, 3000);
  pages.forEach((page, i) => {
    assert.ok(page.end > page.start && page.end - page.start <= 980);
    if (i) assert.equal(page.start, pages[i - 1].end);
    assert.ok(!lines.some((line) => line.start < page.end && line.end > page.end));
  });
});

test('keeps short paragraphs and heading groups together', () => {
  assert.equal(planPdfPages(1500, 980, [], [{ start: 880, end: 1040 }])[0].end, 880);
});

test('resolves overlapping inline runs and table rows', () => {
  const pages = planPdfPages(1600, 980, [{ start: 970, end: 995 }, { start: 950, end: 975 }]);
  assert.equal(pages[0].end, 950);
});

test('honors explicit breaks without creating a blank first page', () => {
  assert.deepEqual(planPdfPages(1500, 980, [], [], [0, 700]), [{ start: 0, end: 700 }, { start: 700, end: 1500 }]);
});

test('oversized elements cannot cause an infinite loop or oversized pages', () => {
  assert.deepEqual(planPdfPages(2400, 980, [{ start: 0, end: 2400 }]), [
    { start: 0, end: 980 }, { start: 980, end: 1960 }, { start: 1960, end: 2400 },
  ]);
});

test('adjacent fractional table rows fill pages instead of cascading backwards', () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ start: 0.5 + i * 50, end: 0.5 + (i + 1) * 50 }));
  const pages = planPdfPages(3001, 980, rows);
  assert.equal(pages.length, 4);
  assert.equal(pages[0].end, 950.5);
});
