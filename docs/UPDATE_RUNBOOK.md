# Monthly update runbook

Produces one new edition of the B2A Economy dashboard. Only `data.js` changes, unless a defect in `index.html` has to be fixed.

- Repository: `andcalcagnonyc/b2a`, branch `main`
- Live artifact: https://claude.ai/artifact/3SZtPVT6e7Yy5D3jh7FhXu (slug `13c42366-a6e2-4710-b9a5-beeb5715b9b0`)
- Edition naming: `YYYY.MM`

## Rules

1. Never invent a number. If a figure cannot be confirmed at a source, leave the previous value, or remove it, and say so in the QA log.
2. Paraphrase sources. Do not copy sentences.
3. Record only the years a forecaster states. Do not interpolate published forecasts.
4. Keep the evidence classes honest: `reported`, `estimate`, `forecast`, `modelled`, `judgement`.
5. Dashboard text is in English, plain and short.
6. Do not change the designer credit or the visual design.

## Steps

### 1. Refresh actuals

Search for new releases of each recurring source and update `signals` and `series`:

- HUMAN Security monthly State of Agentic Traffic (agent traffic growth, share by agent, share by industry, checkout share)
- Adobe Analytics AI-referred retail traffic (growth, conversion, revenue per visit)
- Shopify quarterly results (AI-driven traffic and orders)
- Cloudflare Radar and quarterly results; Imperva Bad Bot Report (yearly)
- Similarweb AI shopper-journey share
- ChatGPT weekly users and other assistant user counts
- GitHub, Supabase, Stripe, Vercel statements on agent share of activity
- MCP registry size
- Any follow-up pieces in the a16z B2A series

Add a new signal when a notable new measurement appears. Retire one when it is superseded, and say so in the changelog.

### 2. Refresh forecasts

Check for new or revised editions from EMARKETER, Morgan Stanley, Bain, McKinsey, Gartner, IDC, Forrester, Juniper, Deloitte, MarketsandMarkets, Grand View and Roland Berger. Update `model[].anchors` and `outlook`. Confirm the open item from edition 2026.11: EMARKETER's revised 2030 figure of about $134B was seen as a chart title only.

### 3. Re-anchor the model

For each entry in `model`:

- Update `hist` when a new actual or estimate for the current year exists.
- Adjust `paths` only when an anchor changed or an actual moved outside the band. Keep low ≤ base ≤ high, each path rising.
- Rewrite `method` so the text matches the numbers.

In the January edition, roll the year: set `meta.currentYear` to the new year, add the closed year to each `hist`, shift each path forward one year, and add the new year to every sector's `impact`.

### 4. Sectors and technologies

Add or replace evidence where there is something new (funding rounds, standards status, adoption data, court or regulatory decisions). Change a score or a mainstream year only when the evidence supports it, and note the change in the changelog.

### 5. Independent data review

Have a separate agent that did not make the edits check: the changed figures against their sources, attribution, evidence classes, dates, and wording that overstates a source. Fix what it finds.

### 6. Record the edition

- `meta.asOf`, `meta.version`, `meta.nextUpdate`
- `qa.data`: what was checked, what was fixed, what stays open
- `changelog`: add the new edition at the top with a one or two sentence summary of what changed
- `README.md`: current edition line and the edition in the citation line

### 7. Validate

```
node scripts/validate.mjs
```

It must print `OK`. Then rebuild the open dataset:

```
node scripts/export.mjs
```

Update the row counts in the README's open dataset table if they changed, and `version` and `date-released` in `CITATION.cff`. If the method itself changed, update `METHODOLOGY.md` and add a row to its method changes table. If a browser is available, open each of the six views once and confirm there are no script errors.

### 8. Commit and publish

1. Commit to `main` with the message `Edition YYYY.MM` and push.
2. Read the artifact's current state (version and who it is shared with).
3. Republish `data.js` (and `index.html` only if it changed) to the artifact in patch mode, passing the current version and the current sharing value.

### 9. Report

Summarise in a few lines: what changed, what was corrected, what could not be verified, and anything that needs the designer's decision.
