# Brush Hog Business Suite - Project Summary

**Status:** Live and in crew testing | **Last updated:** 2026-10-09

A browser-based business system for a one-tractor brush hog (rotary cutter) mowing operation: cost modeling, job pricing, client records, and professional quoting - with no server, no accounts, and no database.

**Live app:** https://byrnesz.github.io/brush-hog-cost-revenue-mode/
**Crew instructions:** [USER-GUIDE.md](USER-GUIDE.md) | **Technical overview:** [README.md](README.md)

---

## The Concept

The core idea never changed from day one: **know your true cost per job before you quote a price.** A 40HP tractor with a 5-foot cutter has real, calculable costs - depreciation, insurance, fuel, maintenance, labor, travel - and a real revenue floor. The project exists to make that math fast, repeatable, and hard to get wrong, so the operator can quote profitable jobs from the truck instead of a gut feeling.

Everything else grew out of that: scenarios to compare job types, clients to remember who was quoted what, quotes to turn a price into a professional document, and exports to keep the records safe.

## How It Got Here (Iteration History)

### Phase 1 - The Spreadsheet Model (v1)

The original deliverable was a static HTML page presenting a spreadsheet-style table: fixed costs (annual depreciation, insurance, licensing, admin), variable costs (fuel, maintenance, labor per hour), a job simulator, dual pricing (per-acre vs hourly with a 2-hour minimum), risk rules (terrain multipliers, show-up fees, down-time clause), and travel adjustments. Users copied the table into Excel or Google Sheets and edited highlighted cells.

**Reasoning:** validate the business model itself before building anything sophisticated. The model is calibrated to a 40HP tractor + 5' cutter but parameterized so any equipment configuration works.

### Phase 2 - The Interactive Calculator (v2)

The spreadsheet became a React calculator app: the same cost and revenue engine, but with instant recalculation, an Inputs / Results / Scenarios layout, scenario saving and comparison, and CSV export.

**Reasoning:** interactive beats static for experimentation. Changing one input (fuel price, terrain, acreage) and watching margin move in real time makes the model something the operator actually uses rather than a one-time study.

### Phase 3 - The Business Suite (v3)

Three modules were added around the calculator:

- **Clients** - a simple CRM: contact details, billing and property addresses, job notes
- **Quotes** - a quote builder that auto-imports the calculator's pricing as line items, assigns sequential quote numbers, tracks pipeline status (Draft / Sent / Approved / Declined / Expired), and prints a professional document with logo, terms, and signature lines
- **Settings** - business identity, logo, tax rate, payment terms, and default terms and conditions that pre-fill new quotes

**Reasoning:** the calculator answered "what should this job cost?" - but a price number alone does not win work. The natural workflow gap was turning that number into a document a client can approve, and remembering what was quoted to whom. No backend was built: the data model was (and is) still being developed, and browser-local storage with export/backup is sufficient while the fields and workflow are still taking shape.

### Phase 4 - GitHub Deployment (v4)

The app was split into three modules (`calculator.jsx`, `quote-suite.jsx`, `app.jsx`) and deployed as a static GitHub Pages site - React 18 loaded from CDN with Babel Standalone transpiling JSX in the browser, no build step, no bundler.

**Reasoning:** a durable public URL the crew can open from any device, version history for every change, and an edit-from-anywhere workflow (files are editable in the GitHub web UI itself). The file split keeps calculator logic separate from the CRM/quote modules so each can evolve independently.

Deployment was slowed by two practical lessons: the integration's repository write access was never successfully granted (commits were made manually through the web UI), and copy-paste through chat tools corrupted UTF-8 characters - solved permanently by writing emoji as ASCII-safe Unicode escapes, so the source files contain nothing that can be corrupted in transit.

### Phase 5 - Hardening for Crew Use (v5, current)

A series of changes aimed at making the tool usable by people other than the owner:

- **Logo upload** in Settings (auto-resized, embedded on printed quotes)
- **Quote numbers pre-assigned at creation** (Q-YYYYMMDD-NNN), so drafts are printable with numbers and abandoned drafts never leave gaps
- **Data export and backup** - one-click full JSON backup of all records plus per-entity CSVs for spreadsheets
- **USER-GUIDE.md** - plain-language crew instructions from zero to printed quote
- **README v2** - rewritten for the app era (the v1 README still described the spreadsheet workflow)

**Reasoning:** every one of these closes a "second person" gap. A logo makes quotes look legitimate; predictable quote numbers prevent bookkeeping confusion; backups protect against the reality of browser-local storage; a guide means the owner does not have to train everyone personally.

## Key Architecture Decisions

| Decision | Why |
|----------|-----|
| Static site, no server, no database | Still in field/requirements development; avoids maintaining infrastructure while the data model settles |
| Data in browser localStorage | Zero setup for users; keys: brushHogState, brushHogScenarios, brushHogClients, brushHogQuotes, brushHogSettings |
| JSON backup + CSV exports | The database surrogate: complete restorable snapshots plus analysis-friendly spreadsheets |
| React 18 UMD + Babel Standalone from CDN | No build step - the repo IS the running app; edits are plain file changes |
| Three IIFE modules sharing via window | No bundler; load order (calculator, quote-suite, app) keeps dependencies satisfied |
| Quote print as standalone HTML document | Full control of print layout; embeds logo, totals, terms, signature lines |
| ASCII-only source files | Paste/copy pipelines cannot corrupt what is not there; emoji via Unicode escapes and HTML entities |
| Quote numbers from saved-quote count | Sequential, date-coded, no gaps from abandoned drafts |

## Open Items / Roadmap

See also: [GitHub Issues](https://github.com/Byrnesz/brush-hog-cost-revenue-mode/issues)

1. **Requirements backlog (28-item questionnaire).** A structured requirements questionnaire (quote numbering, payment terms, rates, and other business rules) is being answered by the owner. Some items are already handled by the app: quote numbering (pre-assigned at creation), payment terms and default terms (Settings), and base rates and terrain multipliers (Calculator). The remaining answers will drive the next round of development.  ([#1](https://github.com/Byrnesz/brush-hog-cost-revenue-mode/issues/1))

2. **Google Calendar job scheduling.** Planned next feature: schedule quoted/approved jobs onto the owner's calendar. His Google calendars are already connected on this platform (including a "DAILY LOGS" calendar).  ([#2](https://github.com/Byrnesz/brush-hog-cost-revenue-mode/issues/2))

3. **Backup import/restore.** Exports exist; import does not. Deliberately deferred until the data model stabilizes - building import against a schema still in flux is wasted work.

4. **UX simplification.** The owner has identified making the app more intuitive as a priority. The USER-GUIDE.md is the interim bridge; its troubleshooting table doubles as a UX defect list.

5. **Repository write integration.** The GitHub App's write access remains unresolved; deployments are manual file pastes. Revisit the connector authorization (or move to CLI-based pushes) to restore one-commit deployments.

## Lessons Learned

- **Fast iteration without documentation works until a second person arrives.** The speed of the chat-driven change cycle was the project's engine - but every undocumented decision had to be re-excavated the moment crew testing started. This document, the user guide, and the README rewrite are the correction.
- **Single source of pricing truth pays off.** Because quotes import line items from the calculator, a rate change propagates in one step ("Refresh Pricing from Calculator"), and no one quotes from stale numbers.
- **Browser-local data demands a backup habit.** The JSON export is the only protection against a cleared browser. The guide teaches this to every user.
- **Choose encodings your pipeline can survive.** The emoji corruption saga's permanent fix was not "be careful when copying" - it was removing the failure mode entirely.

---

*This summary is a living document - update it when a phase closes or a roadmap item lands.*
