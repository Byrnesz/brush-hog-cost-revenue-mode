(function () {
  const { useState, useEffect } = React;

// ============================================
// DEFAULT STATE & CONSTANTS
// ============================================

// Default values for a 40HP tractor with 5' brush hog
// These values pre-populate the form inputs and represent typical industry values
const defaultState = {
  // --- FIXED COSTS (Annual) ---
  // These are one-time or recurring annual expenses that don't scale with usage
  equipmentPurchasePrice: 35000,  // Total cost of tractor + brush hog combined
  salvageValue: 5000,              // Estimated resale value at end of equipment life
  usefulLife: 10,                // Expected lifespan in years (standard for agricultural equipment)
  annualInsurance: 900,           // Annual liability insurance cost for commercial operations
  businessAdmin: 500,             // Annual business administration costs (software, phone, etc.)
  annualLicense: 200,             // Annual equipment licensing and registration fees

  // --- VARIABLE OPERATING COSTS (Per Hour) ---
  // These costs scale linearly with engine runtime hours
  tractorHP: 40,                  // Tractor horsepower rating (determines fuel consumption)
  fuelConsumptionFactor: 0.044,   // Gallons per HP per hour (standard diesel engine efficiency)
  fuelPrice: 3.50,                // Local diesel/gasoline price per gallon (user-adjustable)
  maintenanceAllocation: 8.50,    // Hourly maintenance budget (blades, pins, lubricants, wear parts)
  operatorLaborRate: 25.00,        // Hourly wage for equipment operator (market rate)
  equipmentWearFactor: 1.2,       // Multiplier for brush hogging vs standard mowing (higher wear from debris)

  // --- JOB SIMULATOR ---
  // Configuration for simulating specific mowing jobs
  projectSize: 5,                 // Default project size in acres for simulation
  cutterWidth: 5,                 // Brush hog cutter width in feet (affects efficiency)
  baseRatePerAcre: 120,           // Standard per-acre billing rate (industry benchmark: $85-$120)
  baseRatePerHour: 100,           // Standard hourly billing rate (industry benchmark: $85-$120)
  minimumHours: 2,                // Minimum charge for small jobs (prevents losses on short jobs)

  // --- TRAVEL ADJUSTMENTS ---
  // Mobility and transportation considerations
  travelDistance: 5,              // One-way distance to job site in miles

  // --- RISK RULES ---
  // Adjustments for difficult conditions and delays
  terrainType: "Open Field",       // Default terrain type (affects pricing multiplier)
  downTimeClauseActive: true,      // Whether to charge for downtime/delays (risk mitigation)
  downTimeHours: 0.5,              // Estimated average downtime per job in hours
};

// Terrain multipliers for risk-based pricing
// These adjust revenue based on difficulty/complexity of the terrain
// Higher multipliers compensate for increased wear, time, and risk
const terrainMultipliers = {
  "Open Field": 1.0,    // No adjustment for easy, clear terrain
  Slopes: 1.2,         // +20% for sloped terrain (harder to navigate, more wear)
  "Thick Brush": 1.5,  // +50% for dense vegetation (slower progress, more blade wear)
  Rocks: 1.8,          // +80% for rocky/obstacle-heavy terrain (high risk of damage)
};

// Calculate show-up fee based on travel distance
// This covers mobilization costs (fuel, time, wear) for distant jobs
// Implements tiered pricing to ensure profitability at various distances
const getShowUpFee = (distance) => {
  if (distance <= 5) return 175;    // Short distance: $175 (local jobs)
  if (distance <= 10) return 200;   // Medium distance: $200 (moderate travel)
  if (distance <= 15) return 225;   // Long distance: $225 (extended travel)
  return 250;                      // Very long distance: $250 (remote jobs, 20+ miles)
};

// Format number as USD currency
// Uses Intl.NumberFormat for proper localization and consistent formatting
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format number with specified decimal places
// Defaults to 2 decimal places if not specified
// Ensures consistent display of numeric values throughout the UI
const formatNumber = (value, decimals = 2) => value.toFixed(decimals);

// ============================================
// MAIN COMPONENT
// ============================================

const BrushHogCalculator = () => {
  // --- STATE MANAGEMENT ---
  // state: Stores all user inputs and configuration for calculations
  // scenarios: Array of saved scenario configurations for later retrieval
  // activeTab: Tracks current active tab ('inputs', 'results', or 'scenarios')
  // showSaveModal: Controls visibility of the save scenario modal dialog
  // scenarioName: Temporary storage for new scenario name during creation
  const [state, setState] = useState({ ...defaultState });
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState("inputs");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  // Handle input changes from form fields
  // Extracts name, value, type, and checked properties from the event target
  // Intelligently handles different input types:
  // - Checkboxes: Uses the checked boolean value directly
  // - Numbers: Parses as float, defaults to 0 if invalid
  // - Text: Uses the raw string value
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      // Type-specific handling ensures proper data types in state
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  // ============================================
  // CORE CALCULATION FUNCTION
  // This is the heart of the calculator - computes all financial metrics
  // Called on every render to ensure real-time updates as inputs change
  // ============================================
  const calculateResults = () => {
    // --- FIXED COST CALCULATIONS ---
    // Fixed costs are annual expenses that must be allocated across operating hours
    
    // Annual depreciation using straight-line method
    // Formula: (Purchase Price - Salvage Value) / Useful Life
    // Represents the annual loss in equipment value due to usage and age
    const annualDepreciation = (state.equipmentPurchasePrice - state.salvageValue) / state.usefulLife;
    
    // Total annual fixed costs (depreciation + insurance + admin + license)
    // Sum of all non-variable annual expenses for equipment ownership
    const totalAnnualFixedCosts = 
      annualDepreciation + 
      state.annualInsurance + 
      state.businessAdmin + 
      state.annualLicense;
    
    // Fixed cost per hour (assuming 100 operating hours per year)
    // This allocates annual fixed costs across estimated operating hours
    // Note: 100 hours/year is a conservative estimate for part-time operations
    const fixedCostPerHour = totalAnnualFixedCosts / 100;

    // --- VARIABLE COST CALCULATIONS ---
    // Variable costs scale directly with operating hours
    
    // Fuel consumption in gallons per hour
    // Formula: Tractor HP * Fuel Consumption Factor (Gal/HP/Hour)
    // Based on standard diesel engine consumption rates
    const tractorFuelConsumption = state.tractorHP * state.fuelConsumptionFactor;
    
    // Hourly fuel cost
    // Formula: Fuel Consumption * Fuel Price per Gallon
    // Direct cost of fuel for one hour of operation
    const hourlyFuelCost = tractorFuelConsumption * state.fuelPrice;
    
    // Total variable cost per hour
    // Includes: Fuel + Maintenance (with wear factor) + Labor
    // The wear factor accounts for increased maintenance needs with brush hogging
    const totalVariableCostPerHour = 
      hourlyFuelCost + 
      (state.maintenanceAllocation * state.equipmentWearFactor) + 
      state.operatorLaborRate;
    
    // Combined cost per hour (fixed + variable)
    // Total operating cost per hour of equipment use
    const totalCostPerHour = fixedCostPerHour + totalVariableCostPerHour;

    // --- JOB CALCULATIONS ---
    // Project-specific calculations based on job parameters
    
    // Cutter efficiency in acres per hour
    // Formula: Cutter Width (feet) * 0.2
    // Empirical factor: 5' cutter typically covers ~1 acre/hour
    // For 5' cutter: 5 * 0.2 = 1.0 acres/hour
    const cutterEfficiency = state.cutterWidth * 0.2;
    
    // Project time in hours
    // Formula: Project Size (acres) / Cutter Efficiency (acres/hour)
    // Estimates actual time required to complete the job
    const projectTime = state.projectSize / cutterEfficiency;
    
    // Total variable cost for the job
    // Formula: Project Time * Variable Cost per Hour
    // Direct variable costs (fuel, maintenance, labor) for this specific job
    const totalVariableCost = projectTime * totalVariableCostPerHour;
    
    // Fixed cost allocation for this job
    // Formula: Fixed Cost per Hour * Project Time
    // Portion of annual fixed costs allocated to this specific job
    const fixedCostAllocation = fixedCostPerHour * projectTime;
    
    // Total job cost (variable + fixed allocation)
    // Complete cost of performing this job, including allocated overhead
    const totalJobCost = totalVariableCost + fixedCostAllocation;

    // --- REVENUE CALCULATIONS ---
    // Income calculations based on billing method
    
    // Gross revenue if billing per acre
    // Formula: Project Size * Rate per Acre
    // Standard billing method for larger, well-defined areas
    const grossRevenuePerAcre = state.projectSize * state.baseRatePerAcre;
    
    // Gross revenue if billing hourly
    // Uses maximum of actual time or minimum hours (for small jobs)
    // Formula: max(Project Time, Minimum Hours) * Hourly Rate
    // Ensures minimum charge is met even for quick jobs
    const grossRevenueHourly = Math.max(projectTime, state.minimumHours) * state.baseRatePerHour;
    
    // Final revenue - auto-selects billing method based on project size
    // Business rule: Uses per-acre for jobs >= 2 acres, hourly for smaller jobs
    // This matches industry practice where per-acre is more predictable for larger jobs
    const finalRevenue = state.projectSize >= 2 ? grossRevenuePerAcre : grossRevenueHourly;

    // --- TRAVEL CALCULATIONS ---
    // Transportation-related metrics
    
    // Round-trip distance
    // Formula: One-Way Distance * 2
    // Total distance traveled to and from the job site
    const roundTripDistance = state.travelDistance * 2;
    
    // Estimated travel time
    // Formula: Round-Trip Distance / 40 mph (average speed)
    // Assumes average travel speed of 40 mph including stops and traffic
    const travelTime = roundTripDistance / 40;
    
    // Show-up fee based on distance
    // Tiered fee structure to cover mobilization costs
    const showUpFee = getShowUpFee(state.travelDistance);

    // --- RISK RULE CALCULATIONS ---
    // Adjustments for difficult conditions and project risks
    
    // Obstacle multiplier from terrain type
    // Looks up multiplier from terrainMultipliers object
    // Compensates for increased difficulty, time, and equipment wear
    const obstacleMultiplier = terrainMultipliers[state.terrainType] || 1.0;
    
    // Down-time multiplier (0 if clause not active, otherwise uses downTimeHours)
    // When active, allows billing to continue during unavoidable delays
    const downTimeMultiplier = state.downTimeClauseActive ? state.downTimeHours : 0;
    
    // Adjusted hourly rate with risk multipliers
    // Formula: Base Hourly Rate * Obstacle Multiplier * (1 + Down-Time Multiplier)
    // The (1 + downTimeMultiplier) allows for additional billing during delays
    // This ensures revenue covers non-productive time on difficult jobs
    const adjustedHourlyRate = state.baseRatePerHour * obstacleMultiplier * (1 + downTimeMultiplier);
    
    // Adjusted per-acre revenue with obstacle multiplier
    // Formula: Gross Per-Acre Revenue * Obstacle Multiplier
    // Applies terrain difficulty multiplier to per-acre billing
    const adjustedRevenuePerAcre = grossRevenuePerAcre * obstacleMultiplier;
    
    // Adjusted hourly revenue with both multipliers
    // Formula: Gross Hourly Revenue * Obstacle Multiplier * (1 + Down-Time Multiplier)
    // Applies both terrain and downtime multipliers to hourly billing
    const adjustedRevenueHourly = grossRevenueHourly * obstacleMultiplier * (1 + downTimeMultiplier);

    // --- FINAL SUMMARY CALCULATIONS ---
    // High-level financial summary for the job
    
    // Total cost including show-up fee
    // Complete cost of the job including mobilization
    const finalCost = totalJobCost + showUpFee;
    
    // Adjusted final revenue (with risk multipliers applied)
    // Auto-selects per-acre or hourly based on project size
    // Uses the same billing method selection as finalRevenue
    const adjustedFinalRevenue = state.projectSize >= 2 ? adjustedRevenuePerAcre : adjustedRevenueHourly;
    
    // Net profit after all costs
    // Formula: Adjusted Revenue + Show-Up Fee - Final Cost
    // Bottom-line profit for this job after all expenses
    const finalNetProfit = adjustedFinalRevenue + showUpFee - finalCost;
    
    // Profit margin as percentage
    // Formula: (Net Profit / (Adjusted Revenue + Show-Up Fee)) * 100
    // Returns 0 if finalRevenue is 0 to avoid division by zero
    // Standard business metric showing profitability as percentage of revenue
    const profitMargin = finalRevenue > 0 
      ? (finalNetProfit / (adjustedFinalRevenue + showUpFee)) * 100 
      : 0;

    // Return all calculated values as an object
    // This allows the render method to access any calculated value
    return {
      annualDepreciation,
      totalAnnualFixedCosts,
      fixedCostPerHour,
      tractorFuelConsumption,
      hourlyFuelCost,
      totalVariableCostPerHour,
      totalCostPerHour,
      cutterEfficiency,
      projectTime,
      totalVariableCost,
      fixedCostAllocation,
      totalJobCost,
      grossRevenuePerAcre,
      grossRevenueHourly,
      finalRevenue,
      roundTripDistance,
      travelTime,
      showUpFee,
      obstacleMultiplier,
      adjustedHourlyRate,
      adjustedRevenuePerAcre,
      adjustedRevenueHourly,
      finalCost,
      finalNetProfit,
      profitMargin,
    };
  };

  // Calculate results whenever state changes
  // This triggers re-render with updated values, enabling real-time calculations
  const results = calculateResults();

  // ============================================
  // LOCAL STORAGE MANAGEMENT
  // Persists user data between sessions using browser localStorage
  // ============================================

  // Load saved state from localStorage on initial render
  // Retrieves previously saved user inputs when component mounts
  useEffect(() => {
    const savedState = localStorage.getItem("brushHogState");
    if (savedState) {
      try {
        // Parse and set the saved state
        // Restores all user inputs from previous session
        setState(JSON.parse(savedState));
      } catch (e) {
        // Log error if parsing fails (corrupted data)
        // Gracefully handles malformed or corrupted localStorage data
        console.error("Error loading state:", e);
      }
    }
  }, []); // Empty dependency array = runs once on mount

  // Save state to localStorage whenever it changes
  // Automatically persists all user inputs as they are modified
  useEffect(() => {
    try {
      // Stringify and save current state
      // Serializes the entire state object to JSON for storage
      localStorage.setItem("brushHogState", JSON.stringify(state));
    } catch (e) {
      // Log error if saving fails (storage full, quota exceeded, etc.)
      // Gracefully handles storage limitations
      console.error("Error saving state:", e);
    }
  }, [state]); // Runs whenever state changes

  // Load saved scenarios from localStorage on initial render
  // Retrieves previously saved scenario configurations
  useEffect(() => {
    const savedScenarios = localStorage.getItem("brushHogScenarios");
    if (savedScenarios) {
      try {
        // Parse and set the saved scenarios
        // Restores array of saved scenarios from previous session
        setScenarios(JSON.parse(savedScenarios));
      } catch (e) {
        // Log error if parsing fails
        // Gracefully handles malformed scenario data
        console.error("Error loading scenarios:", e);
      }
    }
  }, []); // Runs once on mount

  // Save scenarios to localStorage whenever they change
  // Automatically persists scenario list when scenarios are added/removed
  useEffect(() => {
    try {
      // Stringify and save current scenarios array
      // Serializes the scenarios array to JSON for storage
      localStorage.setItem("brushHogScenarios", JSON.stringify(scenarios));
    } catch (e) {
      // Log error if saving fails
      // Gracefully handles storage limitations
      console.error("Error saving scenarios:", e);
    }
  }, [scenarios]); // Runs whenever scenarios change

  // ============================================
  // SCENARIO MANAGEMENT FUNCTIONS
  // Functions for saving, loading, and deleting user scenarios
  // ============================================

  // Save current state as a new named scenario
  // Creates a snapshot of current inputs and calculations for later reference
  const handleSaveScenario = () => {
    // Validate scenario name - must not be empty or whitespace
    if (!scenarioName.trim()) {
      alert("Please enter a scenario name");
      return;
    }

    // Create new scenario object with:
    // - Unique ID (timestamp + random string) for identification
    // - User-provided name for display
    // - Copy of current state for the snapshot
    // - Creation timestamp for tracking
    const newScenario = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: scenarioName.trim(),
      state: { ...state },
      createdAt: new Date().toISOString(),
    };

    // Add to scenarios array and reset modal
    // Uses functional update to ensure latest state is used
    setScenarios((prev) => [...prev, newScenario]);
    setScenarioName("");
    setShowSaveModal(false);
  };

  // Load a saved scenario into the current state
  // Restores all inputs from a previously saved scenario
  // Also switches to results tab to show the loaded scenario's calculations
  const handleLoadScenario = (scenario) => {
    setState({ ...scenario.state });
    setActiveTab("results");
  };

  // Delete a scenario after user confirmation
  // Removes a saved scenario from the list
  const handleDeleteScenario = (id) => {
    if (window.confirm("Delete this scenario?")) {
      // Filter out the scenario with matching ID
      // Creates new array without the deleted scenario
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Reset all inputs to default values
  // Restores the application to its initial state
  const handleReset = () => {
    if (window.confirm("Reset to defaults?")) {
      setState({ ...defaultState });
    }
  };

  // ============================================
  // EXPORT FUNCTION
  // Generates and downloads CSV file with all inputs and results
  // Allows users to export data for external analysis or record-keeping
  // ============================================
  const exportToCSV = () => {
    // Define CSV headers - column names for the export
    const headers = ["Category", "Metric", "Value", "Unit"];
    const rows = [];

    // Add input values section
    // Organizes inputs by category for clarity
    rows.push(["", "=== INPUTS ===", "", ""]);
    rows.push(["Fixed Costs", "Equipment Purchase Price", state.equipmentPurchasePrice, "USD"]);
    rows.push(["Fixed Costs", "Salvage Value", state.salvageValue, "USD"]);
    rows.push(["Fixed Costs", "Useful Life", state.usefulLife, "Years"]);
    rows.push(["Variable Costs", "Tractor HP", state.tractorHP, "HP"]);
    rows.push(["Variable Costs", "Fuel Price", state.fuelPrice, "USD/Gal"]);
    rows.push(["Job Simulator", "Project Size", state.projectSize, "Acres"]);
    rows.push(["Job Simulator", "Cutter Width", state.cutterWidth, "Feet"]);
    rows.push(["Travel", "Distance", state.travelDistance, "Miles"]);
    rows.push(["Risk Rules", "Terrain Type", state.terrainType, ""]);

    // Add results section
    // Includes all calculated metrics organized by category
    rows.push(["", "=== RESULTS ===", "", ""]);
    rows.push(["Summary", "Final Revenue", results.finalRevenue + results.showUpFee, "USD"]);
    rows.push(["Summary", "Final Cost", results.finalCost, "USD"]);
    rows.push(["Summary", "Net Profit", results.finalNetProfit, "USD"]);
    rows.push(["Summary", "Profit Margin", results.profitMargin, "%"]);
    rows.push(["Fixed Costs", "Annual Depreciation", results.annualDepreciation, "USD/Year"]);
    rows.push(["Variable Costs", "Fuel Consumption", results.tractorFuelConsumption, "Gal/Hr"]);
    rows.push(["Variable Costs", "Total Variable Cost/Hr", results.totalVariableCostPerHour, "USD/Hr"]);
    rows.push(["Job Calculations", "Project Time", results.projectTime, "Hours"]);
    rows.push(["Job Calculations", "Total Job Cost", results.totalJobCost, "USD"]);
    rows.push(["Travel", "Show-Up Fee", results.showUpFee, "USD"]);
    rows.push(["Risk Rules", "Obstacle Multiplier", results.obstacleMultiplier, "x"]);

    // Convert rows to CSV format
    // Properly escapes cells containing commas by wrapping in quotes
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => 
        row.map((cell) => 
          typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
        ).join(",")
      ),
    ].join("\n");

    // Create downloadable blob and trigger download
    // Generates a CSV file and initiates browser download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `brush-hog-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================
  // RENDER METHOD
  // ============================================

  return (
    // Main container with light gray background for the entire app
    <div className="min-h-screen bg-gray-50">
      {/* HEADER SECTION */}
      {/* Gradient header with title, subtitle, and action buttons */}
      <header className="bg-gradient-to-r from-green-700 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Title and subtitle - left side */}
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-green-300">&#x1F69C; Brush Hog</span> Cost & Revenue Calculator
              </h1>
              <p className="text-green-200 text-sm mt-1">For 40HP Tractor + 5' Brush Hog | Real-time calculations</p>
            </div>
            
            {/* Action buttons - right side */}
            {/* Export, Save Scenario, and Reset buttons for quick actions */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={exportToCSV} className="px-4 py-2 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 shadow">
                &#x1F4E5; Export CSV
              </button>
              <button onClick={() => setShowSaveModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow">
                &#x1F4BE; Save Scenario
              </button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 shadow">
                &#x1F504; Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {/* Container for all tab content with padding */}
      <div className="container mx-auto px-4 py-8">
        
        {/* NAVIGATION TABS */}
        {/* Tab navigation for switching between Inputs, Results, and Scenarios views */}
        <nav className="flex gap-2 mb-8 border-b border-gray-200 flex-wrap">
          <button
            onClick={() => setActiveTab("inputs")}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === "inputs" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            &#x2699;&#xFE0F; Inputs
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === "results" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            &#x1F4CA; Results
          </button>
          <button
            onClick={() => setActiveTab("scenarios")}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
              activeTab === "scenarios" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            &#x1F4BE; Scenarios
          </button>
        </nav>

        {/* INPUTS TAB */}
        {/* Form for entering all calculation parameters */}
        {activeTab === "inputs" && (
          <div className="space-y-6">
            
            {/* FIXED COSTS SECTION */}
            {/* Annual expenses that don't scale with usage */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F4B0; Fixed Costs (Annual)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Equipment Purchase Price input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Equipment Purchase Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="equipmentPurchasePrice" 
                      value={state.equipmentPurchasePrice} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Salvage Value input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salvage Value</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="salvageValue" 
                      value={state.salvageValue} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Useful Life input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Useful Life (Years)</label>
                  <input 
                    type="number" 
                    name="usefulLife" 
                    value={state.usefulLife} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
                
                {/* Annual Insurance input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Insurance</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="annualInsurance" 
                      value={state.annualInsurance} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Business Admin input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Business Admin</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="businessAdmin" 
                      value={state.businessAdmin} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Annual License input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Annual License</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="annualLicense" 
                      value={state.annualLicense} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* VARIABLE COSTS SECTION */}
            {/* Per-hour expenses that scale with operating time */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x2699;&#xFE0F; Variable Operating Costs (Per Hour)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tractor HP input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tractor Horsepower</label>
                  <input 
                    type="number" 
                    name="tractorHP" 
                    value={state.tractorHP} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
                
                {/* Fuel Consumption Factor input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fuel Consumption Factor</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    name="fuelConsumptionFactor" 
                    value={state.fuelConsumptionFactor} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
                
                {/* Fuel Price input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fuel Price (per Gallon)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="fuelPrice" 
                      value={state.fuelPrice} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Maintenance Allocation input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Maintenance Allocation</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="maintenanceAllocation" 
                      value={state.maintenanceAllocation} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Operator Labor Rate input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Operator Labor Rate</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="operatorLaborRate" 
                      value={state.operatorLaborRate} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Equipment Wear Factor input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Equipment Wear Factor</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="equipmentWearFactor" 
                    value={state.equipmentWearFactor} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
              </div>
            </section>

            {/* JOB SIMULATOR SECTION */}
            {/* Parameters for simulating specific mowing jobs */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F4C8; Job Simulator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Project Size input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Project Size (Acres)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="projectSize" 
                    value={state.projectSize} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
                
                {/* Cutter Width input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cutter Width (Feet)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="cutterWidth" 
                    value={state.cutterWidth} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
                
                {/* Base Rate Per Acre input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Base Rate (Per Acre)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="baseRatePerAcre" 
                      value={state.baseRatePerAcre} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Base Rate Per Hour input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Base Rate (Per Hour)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="baseRatePerHour" 
                      value={state.baseRatePerHour} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>
                
                {/* Minimum Hours input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Hours</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="minimumHours" 
                    value={state.minimumHours} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
              </div>
            </section>

            {/* TRAVEL ADJUSTMENTS SECTION */}
            {/* Transportation and mobilization parameters */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F69A; Travel Adjustments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Travel Distance input with show-up fee guide */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Distance (One-Way Miles)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="travelDistance" 
                    value={state.travelDistance} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                  <p className="text-sm text-gray-500 mt-1">Show-Up Fees: 5mi=$175, 10mi=$200, 15mi=$225, 20mi+=$250</p>
                </div>
              </div>
            </section>

            {/* RISK RULES SECTION */}
            {/* Adjustments for difficult conditions and project risks */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x26A0;&#xFE0F; Risk Rules & Adjustments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Terrain Type dropdown with multipliers */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Terrain Type</label>
                  <select 
                    name="terrainType" 
                    value={state.terrainType} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    {Object.entries(terrainMultipliers).map(([key, mult]) => (
                      <option key={key} value={key}>{key} ({mult}x)</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Multiplier applied to revenue</p>
                </div>
                
                {/* Down-Time Clause toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Down-Time Clause Active</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="downTimeClauseActive" 
                      checked={state.downTimeClauseActive} 
                      onChange={handleInputChange} 
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500" 
                    />
                    <span>Billing continues during delays</span>
                  </label>
                </div>
                
                {/* Down-Time Hours input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Down-Time Hours</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="downTimeHours" 
                    value={state.downTimeHours} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* RESULTS TAB */}
        {/* Display of all calculated metrics and financial summary */}
        {activeTab === "results" && (
          <div className="space-y-6">
            
            {/* FINAL SUMMARY SECTION */}
            {/* High-level financial overview with key metrics */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F4CC; Final Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Final Revenue Card - green theme */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <h3 className="text-sm font-semibold text-green-700 mb-2">Final Revenue</h3>
                  <p className="text-3xl font-bold text-green-800">{formatCurrency(results.finalRevenue + results.showUpFee)}</p>
                  <p className="text-xs text-green-600 mt-1">Includes show-up fee</p>
                </div>
                
                {/* Final Cost Card - blue theme */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Final Cost</h3>
                  <p className="text-3xl font-bold text-blue-800">{formatCurrency(results.finalCost)}</p>
                  <p className="text-xs text-blue-600 mt-1">All costs + show-up fee</p>
                </div>
                
                {/* Net Profit Card - emerald theme */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-2">Net Profit</h3>
                  <p className="text-3xl font-bold text-emerald-800">{formatCurrency(results.finalNetProfit)}</p>
                  <p className="text-xs text-emerald-600 mt-1">After all expenses</p>
                </div>
                
                {/* Profit Margin Card - purple theme */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <h3 className="text-sm font-semibold text-purple-700 mb-2">Profit Margin</h3>
                  <p className="text-3xl font-bold text-purple-800">{formatNumber(results.profitMargin)}%</p>
                  <p className="text-xs text-purple-600 mt-1">Percentage of revenue</p>
                </div>
              </div>
            </section>

            {/* FIXED COSTS RESULTS SECTION */}
            {/* Annual fixed cost calculations */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F4B0; Fixed Costs (Annual)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Annual Depreciation</span>
                  <span className="font-bold text-green-700">{formatCurrency(results.annualDepreciation)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Annual Fixed Costs</span>
                  <span className="font-bold text-green-700">{formatCurrency(results.totalAnnualFixedCosts)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Fixed Cost Per Hour</span>
                  <span className="font-bold text-green-700">{formatCurrency(results.fixedCostPerHour)} (at 100 hrs/year)</span>
                </div>
              </div>
            </section>

            {/* VARIABLE COSTS RESULTS SECTION */}
            {/* Per-hour variable cost calculations */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x2699;&#xFE0F; Variable Operating Costs (Per Hour)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Fuel Consumption</span>
                  <span className="font-bold text-blue-700">{formatNumber(results.tractorFuelConsumption)} Gal/Hr</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Hourly Fuel Cost</span>
                  <span className="font-bold text-blue-700">{formatCurrency(results.hourlyFuelCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Variable Cost/Hr</span>
                  <span className="font-bold text-blue-700">{formatCurrency(results.totalVariableCostPerHour)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Cost/Hr</span>
                  <span className="font-bold text-blue-700">{formatCurrency(results.totalCostPerHour)}</span>
                </div>
              </div>
            </section>

            {/* JOB CALCULATIONS RESULTS SECTION */}
            {/* Project-specific calculations */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F4C8; Job Calculations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Cutter Efficiency</span>
                  <span className="font-bold text-emerald-700">{formatNumber(results.cutterEfficiency)} Acres/Hr</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Project Time</span>
                  <span className="font-bold text-emerald-700">{formatNumber(results.projectTime)} Hours</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Variable Cost</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(results.totalVariableCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Fixed Cost Allocation</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(results.fixedCostAllocation)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Job Cost</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(results.totalJobCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Gross Revenue (Per Acre)</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(results.grossRevenuePerAcre)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Gross Revenue (Hourly)</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(results.grossRevenueHourly)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <span className="font-semibold text-gray-700">Final Revenue (Auto-Selected)</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(results.finalRevenue)}
                    <span className="text-sm font-normal text-emerald-600"> ({state.projectSize >= 2 ? "Per-Acre" : "Hourly"} billing)</span>
                  </span>
                </div>
              </div>
            </section>

            {/* TRAVEL RESULTS SECTION */}
            {/* Transportation-related calculations */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x1F69A; Travel Adjustments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Round-Trip Distance</span>
                  <span className="font-bold text-purple-700">{formatNumber(results.roundTripDistance)} Miles</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Travel Time</span>
                  <span className="font-bold text-purple-700">{formatNumber(results.travelTime)} Hours</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <span className="font-semibold text-gray-700">Show-Up Fee</span>
                  <span className="font-bold text-purple-700">{formatCurrency(results.showUpFee)}</span>
                </div>
              </div>
            </section>

            {/* RISK RULES RESULTS SECTION */}
            {/* Risk-adjusted calculations */}
            <section className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">&#x26A0;&#xFE0F; Risk Rules & Adjustments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Obstacle Multiplier</span>
                  <span className="font-bold text-orange-700">{formatNumber(results.obstacleMultiplier)}x</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Adjusted Hourly Rate</span>
                  <span className="font-bold text-orange-700">{formatCurrency(results.adjustedHourlyRate)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Adjusted Revenue (Per Acre)</span>
                  <span className="font-bold text-orange-700">{formatCurrency(results.adjustedRevenuePerAcre)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Adjusted Revenue (Hourly)</span>
                  <span className="font-bold text-orange-700">{formatCurrency(results.adjustedRevenueHourly)}</span>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            {/* Explanation of calculation methodology */}
            <section className="bg-blue-50 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-blue-700 mb-4">&#x1F4DD; How It Works</h2>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li><strong>Auto-Selection:</strong> The calculator automatically uses <strong>per-acre billing</strong> for jobs &#x2265; 2 acres, and <strong>hourly billing</strong> for smaller jobs.</li>
                <li><strong>Risk Multipliers:</strong> Terrain type applies a multiplier to your revenue (Open Field=1.0x, Slopes=1.2x, Thick Brush=1.5x, Rocks=1.8x).</li>
                <li><strong>Down-Time Clause:</strong> When enabled, billing continues during delays, increasing your effective hourly rate.</li>
                <li><strong>Show-Up Fee:</strong> Automatically added based on travel distance (5mi=$175, 10mi=$200, 15mi=$225, 20mi+=$250).</li>
                <li><strong>Profit Margin:</strong> Calculated as (Net Profit / Final Revenue) &#xD7; 100.</li>
              </ul>
            </section>
          </div>
        )}

        {/* SCENARIOS TAB */}
        {/* Management interface for saved scenarios */}
        {activeTab === "scenarios" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-green-700 border-b-2 border-green-200 pb-2">&#x1F4BE; Saved Scenarios</h2>
                <button onClick={() => setShowSaveModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  + New Scenario
                </button>
              </div>

              {/* Empty state for scenarios - shown when no scenarios exist */}
              {scenarios.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No scenarios saved yet.</p>
                  <p className="text-gray-400 mt-2">Save your first scenario to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Scenario cards grid - displays all saved scenarios */}
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Scenario header with name and date */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-green-700">{scenario.name}</h3>
                        <span className="text-xs text-gray-400">{new Date(scenario.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Scenario details - key parameters */}
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Project:</span> {scenario.state.projectSize} acres</p>
                        <p><span className="text-gray-500">Terrain:</span> {scenario.state.terrainType}</p>
                        <p><span className="text-gray-500">Travel:</span> {scenario.state.travelDistance} miles</p>
                      </div>
                      
                      {/* Scenario actions - Load and Delete buttons */}
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleLoadScenario(scenario)} 
                          className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors"
                        >
                          Load
                        </button>
                        <button 
                          onClick={() => handleDeleteScenario(scenario.id)} 
                          className="px-3 py-1.5 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* SAVE SCENARIO MODAL */}
        {/* Dialog for naming and saving a new scenario */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              {/* Modal header with title and close button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-700">Save Scenario</h3>
                <button 
                  onClick={() => { setShowSaveModal(false); setScenarioName(""); }} 
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              {/* Modal body - scenario name input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Scenario Name</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Open Field - 5 Acres"
                />
              </div>
              
              {/* Modal description */}
              <p className="text-sm text-gray-500 mb-6">This will save all current inputs and calculations as a reusable scenario.</p>
              
              {/* Modal footer - action buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowSaveModal(false); setScenarioName(""); }} 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveScenario} 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Save Scenario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {/* Application footer with attribution and technical details */}
      <footer className="bg-gray-800 text-white py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">Brush Hog Cost & Revenue Calculator | Customized for 40HP Tractor + 5' Brush Hog</p>
          <p className="text-gray-500 text-sm mt-1">Data persisted in browser localStorage | Export to CSV available</p>
        </div>
      </footer>
    </div>
  );
};

  window.BrushHogCalculator = BrushHogCalculator;
  window.terrainMultipliers = terrainMultipliers;
  window.getShowUpFee = getShowUpFee;
  window.formatCurrency = formatCurrency;
  window.formatNumber = formatNumber;
  window.defaultState = defaultState;
})();
// end of file
