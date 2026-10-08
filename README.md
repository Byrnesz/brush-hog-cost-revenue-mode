# Brush Hog (Rotary Cutter) Business Suite

A browser-based business suite for Brush Hog (rotary cutter) mowing operations. Built for a **40HP tractor with a 5' brush hog cutter**, but adaptable to any equipment configuration.

> Originally a static spreadsheet-style calculator; now a full React app with quoting, client management, and business settings.

## Live Site

**https://byrnesz.github.io/brush-hog-cost-revenue-mode/**

## Features

### Calculator
- **Fixed cost model**: annual depreciation, insurance, and overhead
- **Variable cost tracking**: fuel, maintenance, and labor per hour
- **Dual quoting engine**: auto-switches between per-acre and hourly billing
- **Risk management**: terrain multipliers (1.0-1.8x), mobilization (show-up) fees scaled for 5-20 mile travel, down-time clause, 2-hour minimum
- **Scenario comparison**: save and compare up to multiple job scenarios
- **CSV / clipboard export**: copy the model into Excel or Google Sheets

### Clients
- Client directory with contact details and job history
- Persisted locally in your browser (no server, no accounts)

### Quotes
- Professional quote builder with auto-generated line items
- Auto-numbered quotes (sequential) with status tracking
- Auto-imports calculated pricing from the Calculator module
- Print / PDF-ready quote layout via your browser's print dialog

### Settings
- Customizable business profile: name, rates, terms, tax settings
- Default values flow into new quotes and the calculator

## How It Works

- Per-acre quoting for jobs >= 2 acres
- Hourly quoting with minimum charge for small lots (< 2 acres)
- Show-up fee scales with travel distance (5mi=$175, 10mi=$200, 15mi=$225, 20mi=$250)
- Fuel consumption: Tractor HP x 0.044 Gal/HP/Hour
- Annual depreciation: (Purchase Price - Salvage Value) / Useful Life

All data is stored in your browser's localStorage (keys: `brushHogState`, `brushHogScenarios`, `brushHogClients`, `brushHogQuotes`, `brushHogSettings`). Clearing site data resets everything, so use the in-app export features to keep backups.

## Example Scenarios

| Scenario | Size | Distance | Terrain | Revenue | Cost | Profit | Margin |
|----------|------|----------|---------|---------|------|--------|--------|
| Open Field | 5 acres | 5 mi | Open Field | $775 | $320 | $455 | 58.7% |
| Thick Brush | 2 acres | 10 mi | Thick Brush | $420 | $240 | $180 | 42.9% |
| Small Lot | 1 acre | 5 mi | Open Field | $275 | $175 | $100 | 36.4% |
| Rocky Terrain | 3 acres | 15 mi | Rocks | $705 | $400 | $305 | 43.3% |

## Tech Stack

- **React 18** (UMD build, no bundler) + **Babel Standalone** for in-browser JSX
- **Tailwind CSS** via CDN
- Plain static files - served straight from GitHub Pages, no build step required

## Repository Structure

```
index.html        Entry point: loads React, Babel, and the app scripts
styles.css        Base styles + print layout for quotes
calculator.jsx    Calculator module + shared helpers (formatters, terrain rates, fees)
quote-suite.jsx   Clients, Quotes, and Settings modules + persistent-state hook
app.jsx           Top-level navigation shell and React mount
deploy.yml        GitHub Actions workflow for Pages deployment
```

Scripts load in that order; shared code is passed between modules via `window`.

## Development

No install needed: open `index.html` in a browser (any local static server works, e.g. `python -m http.server`). Edit the `.jsx` files and refresh. Deployment is automatic on push to `main` via the included workflow.

## Resources

- [Iowa State University Farm Machinery Cost Calculator](https://www.extension.iastate.edu/agdm/crops/html/a3-29.html)
- [USDA Equipment Cost Resources](https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/newsroom/features/?cid=nrcseprd1367244)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request with any improvements.

## License

This project is open source and available under the MIT License (LICENSE).

---

**Customized for 40HP Tractor + 5' Brush Hog | Easily adaptable for any equipment configuration**
