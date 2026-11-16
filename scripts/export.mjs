// Builds the open dataset in data/ from data.js. Run: node scripts/export.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";
const root = new URL("../", import.meta.url);
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL("data.js", root), "utf8"), ctx);
const D = ctx.window.B2A;
mkdirSync(new URL("data/", root), { recursive: true });

const cell = (v) => {
  if (v == null) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = (name, cols, rows) => {
  const out = [cols.join(",")].concat(rows.map((r) => cols.map((c) => cell(r[c])).join(","))).join("\n") + "\n";
  writeFileSync(new URL("data/" + name, root), out);
  return rows.length;
};
const src = (id) => D.sources[id] || {};
const NOW = D.meta.currentYear;
const ed = D.meta.version;
const counts = {};

counts["sources.csv"] = csv("sources.csv", ["source_id", "publisher", "title", "url", "published"],
  Object.entries(D.sources).map(([id, s]) => ({ source_id: id, publisher: s.org, title: s.title, url: s.url, published: s.published })));

counts["signals.csv"] = csv("signals.csv",
  ["edition", "id", "group", "entity", "metric", "value", "previous_value", "unit", "display", "period", "evidence_class", "verification", "source_id", "publisher", "source_url", "note"],
  D.signals.map((s) => ({ edition: ed, id: s.id, group: s.group, entity: s.who, metric: s.label, value: s.value, previous_value: s.prev, unit: s.unit, display: s.display, period: s.period, evidence_class: s.cls, verification: s.verified, source_id: s.src, publisher: src(s.src).org, source_url: src(s.src).url, note: s.note })));

counts["series.csv"] = csv("series.csv", ["edition", "series_id", "title", "unit", "period", "value", "evidence_class", "source_id", "source_url"],
  D.series.flatMap((s) => s.points.map((p) => ({ edition: ed, series_id: s.id, title: s.title, unit: s.unit, period: p.t, value: p.v, evidence_class: s.cls, source_id: s.src, source_url: src(s.src).url }))));

counts["model_scenarios.csv"] = csv("model_scenarios.csv", ["edition", "measure_id", "measure", "unit", "year", "kind", "scenario", "value", "evidence_class", "source_id", "friction_sensitive"],
  D.model.flatMap((m) => [
    ...m.hist.map((h) => ({ edition: ed, measure_id: m.id, measure: m.title, unit: m.unit, year: h.y, kind: "history", scenario: "", value: h.v, evidence_class: h.c, source_id: h.src, friction_sensitive: !!m.friction })),
    ...["low", "base", "high"].flatMap((k) => m.paths[k].map((v, i) => ({ edition: ed, measure_id: m.id, measure: m.title, unit: m.unit, year: NOW + 1 + i, kind: "path", scenario: { low: "conservative", base: "base", high: "accelerated" }[k], value: v, evidence_class: "modelled", source_id: "", friction_sensitive: !!m.friction }))),
  ]));

counts["published_forecasts.csv"] = csv("published_forecasts.csv", ["edition", "metric", "measure_id", "year", "value", "low", "high", "unit", "value_as_stated", "scope", "source_id", "publisher", "source_url", "published"],
  [
    ...D.model.flatMap((m) => (m.anchors || []).map((a) => ({ edition: ed, metric: m.title, measure_id: m.id, year: a.year, value: a.v, low: a.lo, high: a.hi, unit: m.unit, value_as_stated: "", scope: a.scope, source_id: a.src, publisher: src(a.src).org, source_url: src(a.src).url, published: src(a.src).published }))),
    ...D.outlook.map((o) => ({ edition: ed, metric: o.metric, measure_id: "", year: o.year, value: "", low: "", high: "", unit: "", value_as_stated: o.value, scope: "", source_id: o.src, publisher: src(o.src).org, source_url: src(o.src).url, published: src(o.src).published })),
  ]);

const years = [0, 1, 2, 3, 4].map((i) => NOW + i);
counts["sectors.csv"] = csv("sectors.csv", ["edition", "id", "sector", "stage_today", ...years.map((y) => "impact_" + y), "impact_expected", "evidence_strength", "mechanism", "winners", "exposed", "main_risk"],
  D.sectors.map((s) => ({ edition: ed, id: s.id, sector: s.name, stage_today: s.stage, ...Object.fromEntries(years.map((y) => ["impact_" + y, s.impact[y]])), impact_expected: s.impactYear, evidence_strength: s.evidence, mechanism: s.mechanism, winners: s.winners, exposed: s.losers, main_risk: s.risks })));

counts["sector_evidence.csv"] = csv("sector_evidence.csv", ["edition", "sector_id", "metric", "value", "date", "source_id", "source_url"],
  D.sectors.flatMap((s) => s.datapoints.map((d) => ({ edition: ed, sector_id: s.id, metric: d.metric, value: d.value, date: d.date, source_id: d.src, source_url: src(d.src).url }))));

counts["technologies.csv"] = csv("technologies.csv", ["edition", "id", "technology", "layer", "maturity_today", "mainstream_year_base", "evidence_strength", "why_it_matters", "open_problem", "standards", "companies"],
  D.tech.map((t) => ({ edition: ed, id: t.id, technology: t.name, layer: t.layer, maturity_today: t.maturity, mainstream_year_base: t.mainstream, evidence_strength: t.evidence, why_it_matters: t.why, open_problem: t.problem, standards: t.standards, companies: t.companies })));

counts["technology_traction.csv"] = csv("technology_traction.csv", ["edition", "technology_id", "item", "value", "date", "source_id", "source_url"],
  D.tech.flatMap((t) => (t.funding || []).map((f) => ({ edition: ed, technology_id: t.id, item: f.what, value: f.value, date: f.date, source_id: f.src, source_url: src(f.src).url }))));

writeFileSync(new URL("data/b2a-dataset.json", root), JSON.stringify(D, null, 2) + "\n");
console.log("edition", ed, counts);
