(function () {
  const { useState, useEffect } = React;
  const formatCurrency = window.formatCurrency;
  const terrainMultipliers = window.terrainMultipliers;
  const getShowUpFee = window.getShowUpFee;
// ============================================
// SHARED HELPERS & HOOKS (used by all modules)
// ============================================

// Generate a unique ID for records (timestamp + random suffix)
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// usePersistentState: A useState hook that automatically persists to localStorage
// Combines the load-on-mount and save-on-change patterns used above into one reusable hook
// Handles corrupted/missing data gracefully by falling back to the initial value
const usePersistentState = (key, initial) => {
  // Lazy initializer: try to load saved value on first render only
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initial;
    } catch (e) {
      // Corrupted data - fall back to initial value
      return initial;
    }
  });

  // Save to localStorage whenever the value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Silently ignore storage failures (quota exceeded, etc.)
    }
  }, [key, value]);

  return [value, setValue];
};

// Blank client record template - used when adding a new client
const blankClient = () => ({
  id: uid(),
  name: "",
  company: "",
  email: "",
  phone: "",
  billingAddress: "",
  propertyAddress: "", // Job site (if different from billing address)
  notes: "",           // Job notes, access instructions, hazards, preferences
  createdAt: new Date().toISOString(),
});

// Blank manual line item template - used when adding a new quote line
// "cost" is your internal cost (for profit tracking), "rate" is what the client pays
const blankLineItem = () => ({
  id: uid(),
  description: "",
  partNumber: "",
  partDescription: "",
  qty: 1,
  rate: 0,     // Sell price per unit (what client pays)
  cost: 0,     // Your internal cost per unit (for margin tracking)
});

// Blank quote template - populated when creating a new quote
const blankQuote = () => ({
  id: uid(),
  quoteNumber: "",   // Auto-generated when saved
  clientId: "",
  dateCreated: new Date().toISOString().slice(0, 10),
  validDays: 30,     // Quote validity period
  status: "draft",   // draft | sent | approved | declined | expired
  items: [],         // Auto + manual line items
  taxRate: 0,        // Sales tax percentage
  discount: 0,       // Flat discount amount
  notes: "",         // Job notes visible to client
  terms: "",         // Populated from business settings on creation
});

// ============================================
// BUSINESS SETTINGS MODULE
// Stores your company info, branding, and default quote settings
// ============================================

const defaultBusinessSettings = {
  businessName: "Your Business Name",
  tagline: "Brush Hogging & Land Clearing",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoDataUrl: "",   // Paste a base64 data URL or upload later
  taxRate: 0,        // Default sales tax %
  validDays: 30,     // Default quote validity in days
  paymentTerms: "Due on receipt. 50% deposit required on scheduled jobs over $500.",
  termsConditions: "", // Your standard terms & conditions text
};

// Settings panel component - form for business identity and defaults
const SettingsPage = ({ settings, setSettings }) => {
  // Generic change handler for text/number inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">ð¢ Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
            <input type="text" name="businessName" value={settings.businessName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
            <input type="text" name="tagline" value={settings.tagline} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input type="text" name="phone" value={settings.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="text" name="email" value={settings.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <input type="text" name="address" value={settings.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
            <input type="text" name="website" value={settings.website} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Logo (base64 data URL)</label>
            <input type="text" name="logoDataUrl" value={settings.logoDataUrl} onChange={handleChange} placeholder="data:image/png;base64,..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" />
            <p className="text-xs text-gray-500 mt-1">Paste a base64-encoded image URL. Image upload can be added later.</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">âï¸ Quote Defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Default Tax Rate (%)</label>
            <input type="number" step="0.01" name="taxRate" value={settings.taxRate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Default Quote Validity (Days)</label>
            <input type="number" name="validDays" value={settings.validDays} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
          <textarea name="paymentTerms" value={settings.paymentTerms} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
          <textarea name="termsConditions" value={settings.termsConditions} onChange={handleChange} rows="8" placeholder="Payment terms, cancellation policy, weather delays, liability, warranty..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          <p className="text-xs text-gray-500 mt-1">This text will be pre-filled on every new quote and fully editable per quote.</p>
        </div>
      </section>
    </div>
  );
};

// ============================================
// CLIENT MANAGEMENT MODULE
// Capture detailed contact info, job notes, and property details
// ============================================

const ClientsPage = ({ clients, setClients }) => {
  // editing: null when not editing, or a client object being created/modified
  const [editing, setEditing] = useState(null);

  // Save the client currently in the editing form
  // If the client is new (not in list), append it; otherwise update in place
  const handleSave = () => {
    if (!editing.name.trim()) {
      alert("Please enter a client name");
      return;
    }
    setClients((prev) => {
      const exists = prev.some((c) => c.id === editing.id);
      return exists ? prev.map((c) => (c.id === editing.id ? editing : c)) : [...prev, editing];
    });
    setEditing(null);
  };

  // Delete a client after confirmation
  const handleDelete = (id) => {
    if (window.confirm("Delete this client?")) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Start editing a copy of an existing client (copy avoids mutating saved data)
  const handleEdit = (client) => setEditing({ ...client });

  // Handle form field changes in the editing form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Client editing form (shown when adding or editing) */}
      {editing ? (
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">
            {clients.some((c) => c.id === editing.id) ? "Edit Client" : "New Client"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Client Name *</label>
              <input type="text" name="name" value={editing.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company (optional)</label>
              <input type="text" name="company" value={editing.company} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={editing.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="text" name="email" value={editing.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Address</label>
              <input type="text" name="billingAddress" value={editing.billingAddress} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Property / Job Site Address (if different)</label>
              <input type="text" name="propertyAddress" value={editing.propertyAddress} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Notes (access instructions, hazards, preferences, history)</label>
              <textarea name="notes" value={editing.notes} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Client</button>
          </div>
        </section>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-green-700">ð¥ Clients ({clients.length})</h2>
            <button onClick={() => setEditing(blankClient())} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
              + New Client
            </button>
          </div>

          {/* Empty state when no clients exist yet */}
          {clients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <p className="text-gray-500 text-lg">No clients yet.</p>
              <p className="text-gray-400 mt-2">Add your first client to start building quotes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-green-700">{client.name}</h3>
                    {client.company && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{client.company}</span>}
                  </div>
                  {client.phone && <p className="text-sm text-gray-600">ð {client.phone}</p>}
                  {client.email && <p className="text-sm text-gray-600">âï¸ {client.email}</p>}
                  {client.propertyAddress && <p className="text-sm text-gray-500 mt-1">ð {client.propertyAddress}</p>}
                  {client.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{client.notes}</p>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(client)} className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600">Edit</button>
                    <button onClick={() => handleDelete(client.id)} className="px-3 py-1.5 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// QUOTE BUILDER MODULE
// Generates client-ready quotes: auto-populated from calculator "sell" data
// plus fully manual line items, subtotals, tax, and totals
// ============================================

// Build the automatic line items from the calculator's saved state
// Reads "brushHogState" (the calculator's persisted inputs) so the quote
// always reflects the latest pricing configuration
const buildAutoItems = () => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem("brushHogState") || "{}");
  } catch (e) {
    s = {};
  }
  // Guard: fall back to defaults if the calculator state is empty
  if (!s.projectSize) return [];

  // Recompute the sell-side figures (mirrors the calculator's logic)
  const grossPerAcre = s.projectSize * (s.baseRatePerAcre || 0);
  const grossHourly = Math.max(s.projectSize / ((s.cutterWidth || 5) * 0.2), s.minimumHours || 0) * (s.baseRatePerHour || 0);
  const perAcre = (s.projectSize || 0) >= 2;
  const baseRevenue = perAcre ? grossPerAcre : grossHourly;
  const obstacleMultiplier = terrainMultipliers[s.terrainType] || 1.0;
  const downTimeMultiplier = s.downTimeClauseActive ? s.downTimeHours || 0 : 0;
  const showUpFee = getShowUpFee(s.travelDistance || 0);

  const items = [];
  // Line 1: Base mowing service
  items.push({
    id: uid(), type: "auto",
    description: `Brush Hog Mowing â ${s.projectSize} acres, ${s.cutterWidth}' cutter (${perAcre ? "per-acre" : "hourly"} rate)`,
    qty: 1, rate: baseRevenue, cost: 0,
    partNumber: "", partDescription: "",
  });
  // Line 2: Terrain/difficulty upcharge (only if multiplier > 1)
  const upcharge = baseRevenue * (obstacleMultiplier - 1);
  if (upcharge > 0) {
    items.push({
      id: uid(), type: "auto",
      description: `Terrain adjustment â ${s.terrainType} (${obstacleMultiplier}x factor)`,
      qty: 1, rate: Math.round(upcharge * 100) / 100, cost: 0,
      partNumber: "", partDescription: "",
    });
  }
  // Line 3: Downtime/billing-continuation clause (only when active)
  if (downTimeMultiplier > 0) {
    items.push({
      id: uid(), type: "auto",
      description: `Down-time clause â billing continues during delays (+${(downTimeMultiplier * 100).toFixed(0)}%)`,
      qty: 1, rate: Math.round(baseRevenue * downTimeMultiplier * 100) / 100, cost: 0,
      partNumber: "", partDescription: "",
    });
  }
  // Line 4: Travel / show-up fee
  items.push({
    id: uid(), type: "auto",
    description: `Travel / mobilization fee â ${s.travelDistance} miles one-way`,
    qty: 1, rate: showUpFee, cost: 0,
    partNumber: "", partDescription: "",
  });
  return items;
};

// Quote totals calculator: subtotal, discount, tax, and grand total
const computeQuoteTotals = (quote) => {
  const subtotal = quote.items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
  const discount = Number(quote.discount) || 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * ((Number(quote.taxRate) || 0) / 100);
  const total = taxable + tax;
  // Internal cost total (auto items carry no cost; manual items may)
  const internalCost = quote.items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.cost) || 0), 0);
  return { subtotal, discount, tax, total, taxable, internalCost, margin: total - internalCost };
};

// Generate a sequential, date-based quote number, e.g. Q-20260925-001
const nextQuoteNumber = (quotes) => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `Q-${today}-`;
  const todayCount = quotes.filter((q) => (q.quoteNumber || "").startsWith(prefix)).length;
  return prefix + String(todayCount + 1).padStart(3, "0");
};

// Quotes page: list of quotes + quote editor + printable preview
const QuotesPage = ({ quotes, setQuotes, clients, settings }) => {
  // editing: the quote object being built; preview: boolean toggling print view
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(false);
  // exportUrl: blob URL of the standalone quote document, set by the
  // Print button and rendered as plain <a> links the user clicks directly
  const [exportUrl, setExportUrl] = useState(null);
  // exportBlocked: true when window.open was blocked by the sandbox
  const [exportBlocked, setExportBlocked] = useState(false);

  // Start a new quote, auto-populated from calculator data and business settings
  const handleNewQuote = () => {
    const q = blankQuote();
    q.items = buildAutoItems();
    q.taxRate = settings.taxRate || 0;
    q.validDays = settings.validDays || 30;
    q.terms = settings.termsConditions || "";
    q.notes = settings.paymentTerms || "";
    setEditing(q);
    setPreview(false);
  };

  // Save the quote under construction (assign quote number on first save)
  const handleSave = () => {
    if (!editing.clientId) {
      alert("Please select a client for this quote");
      return;
    }
    setQuotes((prev) => {
      const exists = prev.some((q) => q.id === editing.id);
      const toSave = { ...editing, quoteNumber: editing.quoteNumber || nextQuoteNumber(prev) };
      return exists ? prev.map((q) => (q.id === editing.id ? toSave : q)) : [...prev, toSave];
    });
    // Refresh local copy so the assigned quote number displays immediately
    setEditing((prev) => ({ ...prev, quoteNumber: prev.quoteNumber || nextQuoteNumber(quotes) }));
  };

  // Edit an existing quote (work on a copy)
  const handleEdit = (quote) => { setEditing({ ...quote }); setPreview(false); };

  // Open a saved quote directly in preview mode â for reference or
  // printing a copy when a client requests one
  const handleView = (quote) => { setEditing({ ...quote }); setPreview(true); };

  // Quick status change from the quote card (no need to open the editor)
  const handleStatusChange = (id, newStatus) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
  };

  // Delete a quote after confirmation
  const handleDelete = (id) => {
    if (window.confirm("Delete this quote?")) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  };

  // Update a field on the quote under construction
  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  // Update a single line item field (by item id)
  const handleItemChange = (itemId, field, value) => {
    setEditing((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, [field]: field === "description" || field === "partNumber" || field === "partDescription" ? value : Number(value) || 0 } : it)),
    }));
  };

  // Add a blank manual line item to the quote
  const addLineItem = () => setEditing((prev) => ({ ...prev, items: [...prev.items, blankLineItem()] }));

  // Remove a line item from the quote
  const removeLineItem = (itemId) => setEditing((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }));

  // Re-pull the latest calculator pricing into this quote's auto items
  const refreshAutoItems = () => {
    setEditing((prev) => ({ ...prev, items: [...buildAutoItems(), ...prev.items.filter((it) => it.type !== "auto")] }));
  };

  const client = clients.find((c) => c.id === (editing && editing.clientId));
  const totals = editing ? computeQuoteTotals(editing) : null;

  // ---------- PRINTABLE QUOTE PREVIEW ----------
  if (editing && preview) {
    const validUntil = new Date(new Date(editing.dateCreated).getTime() + Number(editing.validDays) * 86400000).toLocaleDateString();

    // Build a standalone HTML document for the quote and open it in a new window,
    // then trigger the print dialog from that window. This is more reliable than
    // window.print() inside a sandboxed iframe, and gives a clean print layout.
    const printQuote = () => {
      const rows = editing.items
        .map(
          (item) => `<tr>
            <td style="padding:8px 4px;border-bottom:1px solid #ddd;">${item.description}${item.partDescription ? `<div style="font-size:11px;color:#666;">${item.partDescription}</div>` : ""}</td>
            <td style="padding:8px 4px;border-bottom:1px solid #ddd;text-align:right;">${item.partNumber || ""}</td>
            <td style="padding:8px 4px;border-bottom:1px solid #ddd;text-align:right;">${item.qty}</td>
            <td style="padding:8px 4px;border-bottom:1px solid #ddd;text-align:right;">${formatCurrency(item.rate)}</td>
            <td style="padding:8px 4px;border-bottom:1px solid #ddd;text-align:right;font-weight:600;">${formatCurrency(item.qty * item.rate)}</td>
          </tr>`
        )
        .join("");

      const html = `<!DOCTYPE html>
<html><head><title>Quote ${editing.quoteNumber || "Draft"}</title><style>
  body { font-family: Arial, Helvetica, sans-serif; color:#222; margin:40px; }
  table { width:100%; border-collapse:collapse; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #222; padding-bottom:12px; margin-bottom:24px; }
  .meta { text-align:right; }
  h1 { margin:0; font-size:22px; } h2 { margin:0; font-size:20px; }
  .cols { display:flex; gap:40px; margin-bottom:24px; }
  .cols > div { flex:1; }
  .totals { width:260px; margin-left:auto; margin-bottom:24px; font-size:14px; }
  .totals .grand { border-top:2px solid #222; font-weight:bold; font-size:18px; padding-top:4px; }
  .terms { font-size:11px; color:#444; white-space:pre-wrap; }
  .sig { display:flex; gap:60px; margin-top:50px; }
  .sig > div { flex:1; }
  .sigline { border-bottom:1px solid #222; margin-top:40px; }
  .small { font-size:11px; color:#666; }
</style></head><body>
<div class="header">
  <div>
    ${settings.logoDataUrl ? `<img src="${settings.logoDataUrl}" style="max-height:60px; display:block; margin-bottom:8px;" />` : ""}
    <h1>${settings.businessName}</h1>
    <div class="small">${settings.tagline}</div>
    <div class="small">${settings.address}</div>
    <div class="small">${[settings.phone, settings.email, settings.website].filter(Boolean).join(" | ")}</div>
  </div>
  <div class="meta">
    <h2>QUOTE</h2>
    <div style="font-weight:600;">${editing.quoteNumber || "(unsaved draft)"}</div>
    <div class="small">Date: ${new Date(editing.dateCreated).toLocaleDateString()}</div>
    <div class="small">Valid Until: ${validUntil}</div>
  </div>
</div>
<div class="cols">
  <div>
    <div class="small" style="font-weight:bold;text-transform:uppercase;">Bill To</div>
    <div style="font-weight:600;">${client ? client.name : "â"}</div>
    ${client && client.company ? `<div>${client.company}</div>` : ""}
    <div class="small">${client ? client.billingAddress : ""}</div>
    <div class="small">${client ? [client.phone, client.email].filter(Boolean).join(" | ") : ""}</div>
  </div>
  <div>
    <div class="small" style="font-weight:bold;text-transform:uppercase;">Job Site</div>
    <div class="small">${(client && (client.propertyAddress || client.billingAddress)) || "â"}</div>
  </div>
</div>
<table>
  <thead><tr style="border-bottom:2px solid #222;">
    <th style="text-align:left;font-size:11px;text-transform:uppercase;">Description</th>
    <th style="text-align:right;font-size:11px;text-transform:uppercase;">Part #</th>
    <th style="text-align:right;font-size:11px;text-transform:uppercase;">Qty</th>
    <th style="text-align:right;font-size:11px;text-transform:uppercase;">Rate</th>
    <th style="text-align:right;font-size:11px;text-transform:uppercase;">Amount</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
  ${totals.discount > 0 ? `<div style="display:flex;justify-content:space-between;color:#b00;"><span>Discount</span><span>-${formatCurrency(totals.discount)}</span></div>` : ""}
  ${Number(editing.taxRate) > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Tax (${editing.taxRate}%)</span><span>${formatCurrency(totals.tax)}</span></div>` : ""}
  <div class="grand" style="display:flex;justify-content:space-between;"><span>TOTAL</span><span>${formatCurrency(totals.total)}</span></div>
</div>
<div><div class="small" style="font-weight:bold;text-transform:uppercase;">Notes</div><div style="font-size:13px;white-space:pre-wrap;">${editing.notes}</div></div>
<div style="margin-top:16px;"><div class="small" style="font-weight:bold;text-transform:uppercase;">Terms &amp; Conditions</div><div class="terms">${editing.terms}</div></div>
<div class="sig">
  <div><div class="sigline"></div><div class="small">Client Signature &nbsp;&nbsp;&nbsp;&nbsp; Date</div></div>
  <div><div class="sigline"></div><div class="small">Authorized â ${settings.businessName}</div></div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body></html>`;

      // Robust print/export approach for a sandboxed iframe:
      // 1) Create a Blob URL for the standalone quote document
      // 2) Try window.open (may be blocked by the canvas sandbox)
      // 3) ALWAYS render user-clickable <a> links via React state â
      //    links the user clicks directly are far more likely to be
      //    permitted than programmatic window.open
      const blob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      setExportUrl(blobUrl);

      // Attempt direct open; record whether it was blocked so the UI
      // can tell the user which route to take
      let opened = null;
      try {
        opened = window.open(blobUrl, "_blank");
      } catch (e) {
        opened = null;
      }
      setExportBlocked(!opened);
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
        {/* Action bar */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setPreview(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">â Back to Edit</button>
          <button onClick={printQuote} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">ð¨ï¸ Print / Save PDF</button>
        </div>

        {/* Export panel: sandboxed iframes block normal link clicks, but the
            browser's right-click context menu (Open link in new tab / Save
            link as) is not blocked. The UI instructs that path directly. */}
        {exportUrl && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              ð±ï¸ Right-click one of the links below (normal left-clicks are blocked in this view):
            </p>
            <div className="flex gap-3 flex-wrap mb-3">
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                ð Quote Document <span className="font-normal text-blue-100">â right-click, "Open link in new tab" (print starts automatically)</span>
              </a>
              <a
                href={exportUrl}
                download={`quote-${editing.quoteNumber || "draft"}.html`}
                className="inline-block px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800"
              >
                â¬ï¸ Download <span className="font-normal text-gray-300">â right-click, "Save link as" to save the .html file</span>
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Saved file: open it in any browser, press Ctrl/Cmd+P, and choose "Save as PDF" as the destination.
              The file is fully self-contained (logo, totals, terms, signature lines).
            </p>
          </div>
        )}

        {/* Quote header: logo, business info, quote meta */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="logo" className="h-16 mb-2 object-contain" />
            ) : null}
            <h1 className="text-2xl font-bold text-gray-900">{settings.businessName}</h1>
            <p className="text-sm text-gray-600">{settings.tagline}</p>
            <p className="text-xs text-gray-500 mt-1">{settings.address}</p>
            <p className="text-xs text-gray-500">{[settings.phone, settings.email, settings.website].filter(Boolean).join(" | ")}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">QUOTE</h2>
            <p className="text-sm text-gray-700 font-semibold">{editing.quoteNumber || "(unsaved draft)"}</p>
            <p className="text-xs text-gray-500 mt-1">Date: {new Date(editing.dateCreated).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">Valid Until: {validUntil}</p>
          </div>
        </div>

        {/* Bill-to block and property location */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Bill To</h3>
            <p className="font-semibold text-gray-800">{client ? client.name : "â"}</p>
            {client && client.company && <p className="text-sm text-gray-600">{client.company}</p>}
            {client && <p className="text-sm text-gray-600">{client.billingAddress}</p>}
            {client && <p className="text-sm text-gray-600">{[client.phone, client.email].filter(Boolean).join(" | ")}</p>}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Job Site</h3>
            <p className="text-sm text-gray-600">{(client && (client.propertyAddress || client.billingAddress)) || "â"}</p>
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 text-xs font-bold uppercase text-gray-600">Description</th>
              <th className="text-right py-2 text-xs font-bold uppercase text-gray-600">Part #</th>
              <th className="text-right py-2 text-xs font-bold uppercase text-gray-600">Qty</th>
              <th className="text-right py-2 text-xs font-bold uppercase text-gray-600">Rate</th>
              <th className="text-right py-2 text-xs font-bold uppercase text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {editing.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 text-sm text-gray-800">
                  {item.description}
                  {item.partDescription && <span className="block text-xs text-gray-500">{item.partDescription}</span>}
                </td>
                <td className="py-2 text-right text-sm text-gray-600">{item.partNumber}</td>
                <td className="py-2 text-right text-sm text-gray-600">{item.qty}</td>
                <td className="py-2 text-right text-sm text-gray-600">{formatCurrency(item.rate)}</td>
                <td className="py-2 text-right text-sm font-semibold text-gray-800">{formatCurrency(item.qty * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals block */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{formatCurrency(totals.subtotal)}</span></div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span className="font-semibold text-red-600">-{formatCurrency(totals.discount)}</span></div>
            )}
            {Number(editing.taxRate) > 0 && (
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tax ({editing.taxRate}%)</span><span className="font-semibold">{formatCurrency(totals.tax)}</span></div>
            )}
            <div className="flex justify-between border-t-2 border-gray-800 pt-1 text-lg font-bold">
              <span>TOTAL</span><span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes and terms & conditions */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{editing.notes}</p>
        </div>
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Terms & Conditions</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{editing.terms}</p>
        </div>

        {/* Signature block */}
        <div className="grid grid-cols-2 gap-12 pt-4 border-t border-gray-300">
          <div>
            <p className="text-xs text-gray-500 mb-6">Client Signature (approval of quote & terms)</p>
            <div className="border-b border-gray-800 mb-1"></div>
            <p className="text-xs text-gray-500">Signature    Date</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-6">Authorized â {settings.businessName}</p>
            <div className="border-b border-gray-800 mb-1"></div>
            <p className="text-xs text-gray-500">Signature    Date</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- QUOTE EDITOR ----------
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">â Back to Quotes</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">ð¾ Save Quote</button>
          <button onClick={() => setPreview(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">ðï¸ Preview Quote</button>
          <button onClick={refreshAutoItems} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600">ð Refresh Pricing from Calculator</button>
        </div>

        {/* Quote header details */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-green-700 mb-6 border-b-2 border-green-200 pb-2">Quote Details {editing.quoteNumber && `â ${editing.quoteNumber}`}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
              <select name="clientId" value={editing.clientId} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="">â Select a client â</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Date</label>
              <input type="date" name="dateCreated" value={editing.dateCreated} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valid For (Days)</label>
              <input type="number" name="validDays" value={editing.validDays} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
              <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pipeline Status <span className="font-normal text-gray-400">(quotes are saved regardless of status â this only tracks where it is in your sales process)</span></label>
              <select name="status" value={editing.status} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="draft">Draft â not yet sent to client</option>
                <option value="sent">Sent â delivered to client</option>
                <option value="approved">Approved â client accepted</option>
                <option value="declined">Declined â client passed</option>
                <option value="expired">Expired â validity window passed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" name="taxRate" value={editing.taxRate} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Discount ($)</label>
              <input type="number" step="0.01" name="discount" value={editing.discount} onChange={handleQuoteChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </section>

        {/* Line items table: auto-populated items + manual blank fields */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-green-700">Line Items</h2>
            <button onClick={addLineItem} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">+ Manual Line Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Part #</th>
                  <th className="py-2 pr-2">Part Desc.</th>
                  <th className="py-2 pr-2 w-20">Qty</th>
                  <th className="py-2 pr-2 w-28">Rate ($)</th>
                  <th className="py-2 pr-2 w-28">Cost ($)</th>
                  <th className="py-2 pr-2 w-28">Line Total</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {editing.items.map((item) => (
                  <tr key={item.id} className={item.type === "auto" ? "bg-green-50 border-b border-gray-100" : "border-b border-gray-100"}>
                    <td className="py-1.5 pr-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        disabled={item.type === "auto"}
                        className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-transparent disabled:border-0"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="text" value={item.partNumber} onChange={(e) => handleItemChange(item.id, "partNumber", e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="text" value={item.partDescription} onChange={(e) => handleItemChange(item.id, "partDescription", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" step="0.01" value={item.qty} onChange={(e) => handleItemChange(item.id, "qty", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" step="0.01" value={item.rate} onChange={(e) => handleItemChange(item.id, "rate", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input type="number" step="0.01" value={item.cost} onChange={(e) => handleItemChange(item.id, "cost", e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded bg-amber-50" title="Your internal cost (not shown to client)" />
                    </td>
                    <td className="py-1.5 pr-2 text-right font-semibold">{formatCurrency(item.qty * item.rate)}</td>
                    <td className="py-1.5 text-right">
                      <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 font-bold" title="Remove line">â</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Green rows auto-populate from the Calculator tab (pricing refresh button above). Cost column is internal only â never printed on the client quote.</p>
        </section>

        {/* Internal margin summary (not printed) */}
        <section className="bg-amber-50 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-amber-700 mb-4">Internal Summary (not shown on client quote)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-gray-500">Subtotal</p><p className="text-xl font-bold text-gray-800">{formatCurrency(totals.subtotal)}</p></div>
            <div><p className="text-xs text-gray-500">Internal Cost</p><p className="text-xl font-bold text-amber-700">{formatCurrency(totals.internalCost)}</p></div>
            <div><p className="text-xs text-gray-500">Total (after tax)</p><p className="text-xl font-bold text-gray-800">{formatCurrency(totals.total)}</p></div>
            <div><p className="text-xs text-gray-500">Margin</p><p className="text-xl font-bold text-green-700">{formatCurrency(totals.margin)}</p></div>
          </div>
        </section>

        {/* Client-facing notes and terms & conditions editors */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">Notes & Terms (printed on quote)</h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms / Notes</label>
            <textarea name="notes" value={editing.notes} onChange={handleQuoteChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
            <textarea name="terms" value={editing.terms} onChange={handleQuoteChange} rows="6" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </section>
      </div>
    );
  }

  // ---------- QUOTES LIST ----------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-green-700">ð Quotes ({quotes.length})</h2>
        <button onClick={handleNewQuote} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
          + New Quote
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-500 text-lg">No quotes yet.</p>
          <p className="text-gray-400 mt-2">Create a quote â pricing is auto-populated from the Calculator tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => {
            const c = clients.find((cl) => cl.id === quote.clientId);
            const t = computeQuoteTotals(quote);
            const statusColors = { draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700", approved: "bg-green-100 text-green-700", declined: "bg-red-100 text-red-700", expired: "bg-amber-100 text-amber-700" };
            return (
              <div key={quote.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-green-700">{quote.quoteNumber || "Draft"}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[quote.status] || "bg-gray-100"}`}>{quote.status}</span>
                </div>
                <p className="text-sm text-gray-600">Client: {c ? c.name : "â"}</p>
                <p className="text-sm text-gray-500">Dated: {quote.dateCreated}</p>
                <p className="text-lg font-bold text-gray-800 mt-2">{formatCurrency(t.total)}</p>
                {/* Quick status changer directly on the card */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-400 mb-1">Pipeline status</label>
                  <select
                    value={quote.status}
                    onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white capitalize"
                  >
                    <option value="draft">Draft â not yet sent</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleView(quote)} className="flex-1 px-3 py-1.5 bg-purple-500 text-white rounded text-sm font-semibold hover:bg-purple-600" title="Open the saved quote for reference or to print a copy">View</button>
                  <button onClick={() => handleEdit(quote)} className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600">Edit</button>
                  <button onClick={() => handleDelete(quote.id)} className="px-3 py-1.5 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
  window.uid = uid;
  window.usePersistentState = usePersistentState;
  window.defaultBusinessSettings = defaultBusinessSettings;
  window.SettingsPage = SettingsPage;
  window.ClientsPage = ClientsPage;
  window.QuotesPage = QuotesPage;
})();
