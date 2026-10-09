# Brush Hog Business Suite - Crew Guide

How to use the app to price jobs, manage clients, and produce quotes. No technical knowledge needed - everything runs in the website below.

**The app:** https://byrnesz.github.io/brush-hog-cost-revenue-mode/

**Best on a computer or tablet.** All data is saved in the browser you use - if you switch devices or clear browser data, your records will not follow you. Take a backup (Step 6) after any serious work session.

---

## What the App Does

Four screens, switched with the tabs at the top:

| Tab | What it is for |
|-----|----------------|
| Calculator | Work out what a job costs and what to charge |
| Clients | Your customer directory |
| Quotes | Build, save, and print quotes for clients |
| Settings | Your business name, logo, rates, and default terms |

**How they connect:** the Calculator's numbers feed automatically into new quotes. Settings fills in your business details on printed quotes. Clients are who quotes are made out to.

---

## Step 0: First-Time Setup (Settings tab)

Do this once before quoting:

1. Open the **Settings** tab.
2. Fill in **Business Information**: name, tagline, phone, email, address, website.
3. Click **Upload Image** and choose your logo (appears on printed quotes).
4. Set **Quote Defaults**: tax rate, how many days quotes stay valid, payment terms, and terms & conditions. These pre-fill every new quote - you can still change them per quote.
5. Click into another tab and back to make sure it saved (data saves automatically as you type).

---

## Step 1: Price the Job (Calculator tab)

1. Enter the job's details: project size (acres), cutter width, travel distance, terrain type.
2. Check the **Results** view: total cost, recommended price, profit, and margin.
3. The app picks the billing method automatically: per-acre for jobs 2 acres or bigger, hourly with a minimum charge for small lots.
4. If this is a job type you will see again, give it a name and click **Save Scenario** - you can reload it anytime instead of re-entering numbers.
5. Leave the calculator on the numbers for the job you are about to quote - new quotes pull these in automatically.

---

## Step 2: Add the Client (Clients tab)

1. Open the **Clients** tab and click **Add Client** (or equivalent button).
2. Fill in name, company, email, phone, billing address, and the job site (property address) if different. Notes field is for anything worth remembering: gate codes, dogs, hazard notes, preferences.
3. Click **Save Client**.

The client now appears in the quote drop-down.

---

## Step 3: Create the Quote (Quotes tab)

1. Open the **Quotes** tab and click **+ New Quote**.
2. The quote number is assigned automatically (format: Q-YYYYMMDD-001). Line items are pre-filled from the Calculator - review them.
3. **Select the client** (required before saving).
4. Review line items: change descriptions, part numbers, quantities, and rates. Add your own lines with **+ Manual Line Item**. The **Cost** column is your internal cost - it is never printed on the client's copy.
5. If you changed the Calculator numbers after opening the quote, click **Refresh Pricing from Calculator** to pull the new prices in.
6. Set the **Pipeline Status**: Draft, Sent, Approved, Declined, or Expired. You can change it anytime from the quote card.
7. Adjust tax, discount, notes, or terms if needed for this job.
8. Click **Save Quote**.

---

## Step 4: Preview and Print the Quote

1. From the open quote, click **Preview Quote** to see exactly what the client will see.
2. Click **Print / Save PDF**. The quote opens as a document - your browser's print dialog starts automatically.
3. To save as PDF: in the print dialog choose **Save as PDF** as the destination.
4. If the print window is blocked, the app shows a link instead - right-click it and choose **Open link in new tab**, then print from there. You can also download the quote as an HTML file and print it later.

The printed quote shows your logo, business info, line items, totals, and signature lines - and never shows your internal costs.

---

## Step 5: Track Quotes

The **Quotes** tab lists every quote as a card: number, client, date, total, and status.

- **View** - open the saved quote to read or print a copy
- **Edit** - change it and save again
- **Delete** - removes it permanently
- The status drop-down on each card tracks where the job stands (Draft / Sent / Approved / Declined / Expired)

---

## Step 6: Back Up the Data (Settings tab)

All records live only in this browser. Back up regularly - especially after adding clients or quotes:

1. Open the **Settings** tab and scroll to **Data Export & Backup**.
2. Click **Download Full Backup (JSON)** - one file with everything: clients, quotes, scenarios, calculator settings, and business settings. Keep this file somewhere safe.
3. Optional CSV buttons export spreadsheets that open in Excel or Google Sheets (quotes, line items, clients, scenarios, baseline numbers) for review or analysis.
4. File names include the date, so you can tell backups apart.

**Losing browser data, switching computers, or reinstalling the browser will erase the app's records. The JSON backup is the only copy.**

---

## Quick Reference

- Quotes get their numbers automatically; there is nothing to number by hand.
- Small jobs (under 2 acres) bill hourly with a 2-hour minimum; bigger jobs bill per acre.
- Travel fees scale with distance (5 mi = $175 up to 20 mi = $250) and are added automatically.
- The Cost column on quote line items is internal only - clients never see it.
- Everything saves automatically as you type; only quotes and clients have explicit Save buttons.
- If the site looks wrong or empty, press Ctrl+Shift+R (hard refresh) before assuming data is lost.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Quote says "unsaved draft" on the printout | You are previewing before saving - click Save Quote, then print |
| Line item prices look stale | Click Refresh Pricing from Calculator in the quote editor |
| No clients in the quote drop-down | Add the client first (Step 2) |
| Data disappeared | You likely switched browsers/devices or cleared site data - restore from your JSON backup or start fresh |
| Print window does not open | Use the on-screen link: right-click, Open link in new tab |

---

*Guide version 1 - the app is still being improved, so button names and layouts may change. When in doubt, ask.*
