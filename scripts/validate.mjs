// Structural and arithmetic checks for data.js. Run: node scripts/validate.mjs
import { readFileSync } from "node:fs";
import vm from "node:vm";
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL("../data.js", import.meta.url), "utf8"), ctx);
const D = ctx.window.B2A;
const errors = [];
const fail = (m) => errors.push(m);

// every source reference resolves, every source is used
const used = new Set(["a16z"]);
JSON.stringify(D, (k, v) => {
  if ((k === "src" || k === "src2") && typeof v === "string") used.add(v);
  if (k === "more" && Array.isArray(v)) v.forEach((x) => used.add(x));
  return v;
});
for (const id of used) if (!D.sources[id]) fail(`missing source: ${id}`);
for (const id of Object.keys(D.sources)) {
  if (!used.has(id)) fail(`unused source: ${id}`);
  const s = D.sources[id];
  if (!s.org || !s.title || !/^https:\/\//.test(s.url || "")) fail(`incomplete source: ${id}`);
}

// unique ids
for (const key of ["signals", "series", "model", "sectors", "tech"]) {
  const ids = D[key].map((x) => x.id);
  if (new Set(ids).size !== ids.length) fail(`duplicate id in ${key}`);
}

// model paths: low <= base <= high, non-decreasing, above last history value
const NOW = D.meta.currentYear;
for (const m of D.model) {
  const last = m.hist[m.hist.length - 1].v;
  for (const name of ["low", "base", "high"]) {
    const p = m.paths[name];
    if (p.length !== 4) fail(`${m.id}.${name}: needs 4 values (${NOW + 1}..${NOW + 4})`);
    p.forEach((v, i) => {
      if (v < (i ? p[i - 1] : last)) fail(`${m.id}.${name}[${i}] decreases`);
    });
  }
  for (let i = 0; i < 4; i++)
    if (!(m.paths.low[i] <= m.paths.base[i] && m.paths.base[i] <= m.paths.high[i]))
      fail(`${m.id}: low/base/high out of order at index ${i}`);
}

// sectors: scores 0..5 for NOW..NOW+4, non-decreasing
for (const s of D.sectors) {
  let prev = -1;
  for (let y = NOW; y <= NOW + 4; y++) {
    const v = s.impact[y];
    if (!Number.isInteger(v) || v < 0 || v > 5) fail(`${s.id}: bad score for ${y}`);
    if (v < prev) fail(`${s.id}: score decreases at ${y}`);
    prev = v;
  }
}

// technologies: valid layer and year
const layers = new Set(D.techLayers.map((l) => l[0]));
for (const t of D.tech) {
  if (!layers.has(t.layer)) fail(`${t.id}: unknown layer`);
  if (!(t.mainstream >= NOW && t.mainstream <= NOW + 5)) fail(`${t.id}: mainstream year out of range`);
}

console.log(
  `signals ${D.signals.length} · series ${D.series.length} · measures ${D.model.length} · outlook ${D.outlook.length} · sectors ${D.sectors.length} · technologies ${D.tech.length} · sources ${Object.keys(D.sources).length}`
);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("OK");
