# B2A Economy: methodology

This document describes how the B2A Economy dataset and dashboard are built, what each number means, and how far to trust it. It is released under CC BY 4.0 so the method can be reused, criticised and improved.

Edition described: 2026.11. The method changes over time; changes are recorded at the end of this document.

## 1. Scope

The B2A (business-to-agent) economy is commercial activity in which an AI agent, acting for a person or an organisation, is the user, the buyer or the customer of a business. The framing comes from a16z's essay [Welcome to the B2A Economy](https://www.a16z.news/p/welcome-to-the-b2a-economy) (Olivia Moore and Justine Moore, November 2026).

The dataset covers five things:

1. **Signals**: what has already happened, as reported by companies and measurement firms.
2. **Published forecasts**: what research firms and banks predict for 2027 to 2030.
3. **A scenario model**: this project's own projection of six measures to 2030.
4. **Sector impact**: a 0 to 5 score per year for twelve industries.
5. **Technology readiness**: fifteen technology areas, with maturity today and an estimated year of mainstream use.

It does not cover AI capability forecasting, company valuations as investment views, or labour-market effects beyond the published forecasts it lists.

## 2. Evidence classes

Every number in the dataset carries exactly one class. The class says where the number comes from, not how reliable it is.

| Class | Definition | Example |
|---|---|---|
| `reported` | Stated by the company itself, or measured by a named firm on its own data | GitHub's share of pull requests started by agents |
| `estimate` | A third-party estimate of a current or past value, or a figure derived from one. The derivation is given in the note | A market-size estimate for the current year |
| `forecast` | A prediction published by a research firm or bank, shown as stated with the publisher's scope | A 2030 agentic commerce range |
| `modelled` | Computed by this project's scenario model | Any value on a dashed line |
| `judgement` | A score assigned by the analyst from listed evidence, using the rubric in section 6 | A sector's impact score |

A market-size figure from a research firm is an `estimate` even for a past year, because nobody measured it directly.

## 3. Sourcing rules

1. **No number without a source entry.** Each figure points to an entry in `sources` with publisher, title, URL and publication date.
2. **Primary source first.** The original document is opened and the exact figure and period recorded. When the original is paywalled or unreachable, the figure is read through trade coverage and the source entry names both ("X, via Y").
3. **Verification status** is recorded for every signal taken from the a16z article:
   - `yes`: the figure and period match the primary source
   - `partial`: the figure is supported but something differs (the linked page does not contain it, the scope is narrower, or it was read through a secondary source)
   - `no`: the source contradicts it
   - `unreachable`: the source could not be opened
4. **Scope travels with the number.** A share measured on one vendor's network is labelled as such. A figure for US desktop sessions is not presented as a figure for all shoppers.
5. **Forecasts are recorded as stated.** Only the years a publisher gives are recorded. Published forecasts are never interpolated, and the publisher's own definition is kept in the `scope` field.
6. **Sources are paraphrased.** No text is copied from a source.
7. **Nothing is invented.** If a figure cannot be confirmed, it is left out or marked, and the gap is listed in the QA log.

## 4. Scenario model

### 4.1 Structure

Each modelled measure has:

- `hist`: one or more historical points, each with its own evidence class and source
- `paths`: three sets of yearly values for the four years after the current year: `low` (conservative), `base`, `high` (accelerated)
- `anchors`: published forecasts for the same or a similar measure, plotted but never altered
- `method`: a plain-language statement of how the paths were set

### 4.2 Setting the paths

Paths are set by hand against published forecasts, in this order of preference:

1. Start the curve at the most recent estimate that has been revised against actuals.
2. Land the base path on the most narrowly defined, most credible published figure for the end year.
3. Land the conservative and accelerated paths on the low and high ends of the credible published range.
4. Where no published forecast exists, extend the recent measured pace, flatten curves that approach a natural ceiling, and say in `method` that the path is this project's own.

Constraints checked by `scripts/validate.mjs`: for every year, conservative ≤ base ≤ accelerated; every path is non-decreasing; every path starts above the last historical value.

### 4.3 Adoption pace

A single dial `p` from 0 to 100 blends between paths on a log scale. For a year with values `L`, `B`, `H`:

```
p ≤ 50:  value = exp( ln L + (ln B − ln L) · p/50 )
p > 50:  value = exp( ln B + (ln H − ln B) · (p−50)/50 )
```

The three named scenarios are `p` = 15 (conservative), 50 (base) and 85 (accelerated). `p` = 0 and 100 reproduce the outer paths exactly.

### 4.4 Friction

A second dial delays transaction measures by `d` months, from 0 to 18. It stands in for slow dispute rules, fraud losses or weak consumer trust. Only measures flagged `friction` respond. The value shown for year `y` is the path evaluated at `y − d/12`, and the scenario band shifts with it.

### 4.5 Between years

Values between yearly points are interpolated linearly in log space, which corresponds to a constant growth rate within each year.

### 4.6 What the model is not

It is not a statistical fit and has no confidence intervals. The band is a range between published views, not a probability. The model exists to make assumptions explicit and adjustable.

## 5. Published forecasts

Forecasters use different definitions, and most of the spread between them is definitional. For agentic commerce the main variants are:

| Definition | Meaning |
|---|---|
| Executed | The agent completes the purchase |
| Driven or initiated | The sale starts on an AI platform, wherever checkout happens |
| Influenced | An agent shaped the decision |
| Orchestrated | Any commerce in which an agent takes part |

The dataset keeps each publisher's wording in `scope`. Charts plot forecasts next to the modelled band so disagreement is visible, and the method text says when plotted figures are not like for like.

## 6. Sector impact scores

Each sector receives an integer score from 0 to 5 for the current year and each of the next four.

| Score | Meaning |
|---|---|
| 0 | No visible agent activity |
| 1 | Pilots and funding, no measurable share of activity |
| 2 | Agents measurable in discovery or traffic, under 1% of transactions |
| 3 | Agents shape discovery for a meaningful share of customers and transactions are starting |
| 4 | Agents are a primary channel and carry a material share of transactions or operations |
| 5 | The agent is the default buyer or user, and vendors compete to be chosen by it |

Rules:

- The current-year score must be supported by the evidence listed for the sector.
- Future scores are judgement, informed by the published forecasts, the state of enabling technology, and known blockers such as liability rules.
- Scores never decrease over time within an edition.
- Each sector carries an evidence strength: `strong` (several independent measurements), `moderate` (some measurement plus surveys or forecasts), `thin` (mostly vendor statements, funding or forecasts).
- In the dashboard, scores move one step down or up in the conservative and accelerated scenarios, and never below the current-year score.

## 7. Technology readiness

Each technology area has:

- **Maturity today**: `research`, `early`, `growth` or `mature`
- **Mainstream year (base case)**: the year the area is expected to be in routine use by its natural buyers
- **Evidence strength**, as in section 6

The mainstream year is judged from four inputs: whether a standard exists and at what stage, funding and revenue of the companies building it, live deployments with disclosed volume, and the size of the open problem. In the dashboard the year moves one year earlier or later with the scenario.

## 8. Production pipeline

Each edition is produced by a team of AI agents with separate roles and signed off by the project's human designer.

| Step | Role | Output |
|---|---|---|
| 1 | Article analyst | Every number, claim, named company and linked source in the starting article |
| 2 | Actuals researcher | Each figure checked at its primary source, plus independent measurements |
| 3 | Forecast researcher | Published forecasts for the next four years, as stated |
| 4 | Sector and technology researcher | Evidence by industry and by technology area |
| 5 | Modeller | The dataset and the three scenario paths |
| 6 | Data reviewer | Independent check of figures, attribution, classes and model arithmetic |
| 7 | Interface reviewer | Independent test of the dashboard across screen sizes, themes and keyboard use |
| 8 | Human designer | Review of both reports, decisions on open questions, publication |

The reviewers in steps 6 and 7 do not take part in building what they review.

## 9. Quality review

Each edition runs these checks and publishes the results, including what stays open, in the dataset under `qa`.

**Data**
- Every source reference resolves and every source is used.
- Model paths are ordered and rising; base-scenario output reproduces the base path.
- A sample of figures is re-opened at source. Edition 2026.11 checked 84 figures: 68 matched, 3 were wrong and corrected, 12 could not be found on the cited page, and 1 page could not be opened.
- Labels are checked for overstating a source, mixing up bots and AI agents, and presenting a forecast as an actual.

**Interface**
- Layout at phone, tablet and desktop widths, in light and dark, in every palette.
- Every control, by mouse and by keyboard.
- Text contrast against WCAG AA.

## 10. Known limits

- Several figures in the starting article have no link. The most likely source is shown and marked `partial`.
- Agent traffic shares come from single vendors measuring their own customer networks.
- Bot traffic and AI agent traffic are different things, and sources do not always say which they mean.
- Some historical series splice two publishers with different measurement bases. The method text says where.
- No published forecast was found for agent identity market size, agent-driven fraud losses or a yearly AI share of code. None is modelled.
- Funding and valuation figures are taken from press coverage and are not all re-checked each edition.
- Sector scores and technology years are judgement by one analyst team and have not been tested for agreement between raters.
- a16z has announced an investment in at least one company the article names.

## 11. Update cadence and versioning

Editions are monthly and named `YYYY.MM`. Each edition re-verifies the previous one, records what changed in `changelog`, and tags every row of the CSV exports with its edition. The procedure is in [docs/UPDATE_RUNBOOK.md](docs/UPDATE_RUNBOOK.md). Earlier editions remain available in the repository history.

## 12. Corrections

Corrections are welcome. Open an issue in the repository with the figure, the source you believe is right and a link. Confirmed corrections are applied in the next edition and credited in the update log.

## 13. Method changes

| Edition | Change |
|---|---|
| 2026.11 | First edition |
