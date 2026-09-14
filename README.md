# Brush Hog (Rotary Cutter) Mowing Cost and Revenue Model

A comprehensive financial model for calculating costs, revenue, and profitability for Brush Hog (Rotary Cutter) mowing operations. This model is specifically customized for a **40HP tractor with a 5' brush hog cutter**, but can be easily adapted for any equipment configuration.

## ✨ Features

- **Fixed Cost Calculations**: Annual depreciation, insurance, and overhead
- **Variable Cost Tracking**: Fuel, maintenance, and labor per hour
- **Dual Quoting System**: Auto-switches between per-acre and hourly billing
- **Risk Management**: Obstacle multipliers, down-time clauses, and mobilization fees
- **Travel Adjustments**: Scaling show-up fees for 5-20 mile radii
- **Interactive HTML**: Beautiful, responsive web interface via GitHub Pages

## 🚀 Quick Start

### Option 1: Use the Web Interface
1. Visit the live site: [https://[YOUR_USERNAME].github.io/brush-hog-cost-revenue-model/](https://[YOUR_USERNAME].github.io/brush-hog-cost-revenue-model/)
2. Copy the spreadsheet table into Excel or Google Sheets
3. Customize the highlighted inputs with your actual numbers

### Option 2: Download and Use Locally
1. Clone this repository
2. Open `index.html` in your browser
3. Copy the spreadsheet to your preferred spreadsheet software

## 📊 Spreadsheet Model

The model includes:

### Fixed Costs (Annual)
- Equipment purchase price and depreciation
- Commercial insurance and licensing
- Business administration and marketing

### Variable Costs (Per Hour)
- Fuel consumption based on tractor HP
- Maintenance allocation for blades, pins, lubricants
- Operator labor rates
- Equipment wear factor for brush hogging

### Job Simulator
- Project size and cutter efficiency
- Total project time calculation
- Variable and fixed cost allocation

### Pricing Models
- Per-acre quoting for larger jobs
- Hourly quoting with minimum charge for small lots (<2 acres)
- Automatic switching between models

### Risk Rules
- **Mobilization Fee**: Flat show-up fee scaling with distance (5-20 miles)
- **Obstacle Multiplier**: Adjusts revenue for terrain difficulty (1.0-1.8x)
- **Down-Time Clause**: Hourly billing continues during delays
- **Minimum Charge**: 2-hour minimum for small jobs

### Travel Adjustments
- Distance-based show-up fees
- Round-trip travel time calculation
- Integration with revenue calculations

## 🎯 Example Scenarios

| Scenario | Project Size | Travel Distance | Terrain | Revenue | Cost | Profit | Margin |
|----------|--------------|-----------------|---------|---------|------|--------|--------|
| Open Field | 5 Acres | 5 Miles | Open Field | $775 | $320 | $455 | 58.7% |
| Thick Brush | 2 Acres | 10 Miles | Thick Brush | $420 | $240 | $180 | 42.9% |
| Small Lot | 1 Acre | 5 Miles | Open Field | $275 | $175 | $100 | 36.4% |
| Rocky Terrain | 3 Acres | 15 Miles | Rocks | $705 | $400 | $305 | 43.3% |

## 📥 How to Use

1. **Copy the spreadsheet table** from `index.html` into Excel or Google Sheets
2. **Replace highlighted values** (green cells) with your actual numbers:
   - Equipment purchase price
   - Fuel price
   - Labor rate
   - Project size
   - Travel distance
   - Terrain type
3. **All formulas auto-calculate** - no manual math needed!
4. **Test different scenarios** by adjusting inputs

## 🔧 Customization

To adapt this model for your specific setup:

1. **Change Tractor HP**: Update cell B13 with your tractor's horsepower
2. **Change Cutter Width**: Update cell B24 with your cutter width in feet
3. **Adjust Rates**: Modify the base rates in cells B30 (per acre) and B31 (per hour)
4. **Customize Risk Rules**: Adjust the obstacle multipliers in the formula
5. **Modify Travel Fees**: Edit the show-up fee formula to match your pricing

## 📊 Formulas Explained

### Key Calculations

- **Annual Depreciation**: `(Purchase Price - Salvage Value) / Useful Life`
- **Fuel Consumption**: `Tractor HP × 0.044 Gal/HP/Hour`
- **Hourly Fuel Cost**: `Fuel Consumption × Fuel Price`
- **Project Time**: `Project Size (Acres) / Cutter Efficiency (Acres/Hour)`
- **Obstacle Multiplier**: Dynamic adjustment based on terrain type
- **Show-Up Fee**: Scales with distance (5mi=$175, 10mi=$200, 15mi=$225, 20mi=$250)

### Revenue Selection

The model automatically selects the appropriate billing method:
- **Per-Acre**: For jobs ≥ 2 acres
- **Hourly**: For jobs < 2 acres (with minimum charge)

## 🔗 Resources

- [Iowa State University Farm Machinery Cost Calculator](https://www.extension.iastate.edu/agdm/crops/html/a3-29.html)
- [USDA Equipment Cost Resources](https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/newsroom/features/?cid=nrcseprd1367244)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request with any improvements or additional features.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

**Customized for 40HP Tractor + 5' Brush Hog | Easily adaptable for any equipment configuration**