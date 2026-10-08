(function () {
  const { useState, useEffect } = React;
  const BrushHogCalculator = window.BrushHogCalculator;
  const ClientsPage = window.ClientsPage;
  const QuotesPage = window.QuotesPage;
  const SettingsPage = window.SettingsPage;
  const usePersistentState = window.usePersistentState;
  const defaultBusinessSettings = window.defaultBusinessSettings;
function App() {
  // Top-level view switcher (Calculator renders the original full component)
  const [view, setView] = useState("calculator");

  // Persistent data stores shared across modules
  const [clients, setClients] = usePersistentState("brushHogClients", []);
  const [quotes, setQuotes] = usePersistentState("brushHogQuotes", []);
  const [settings, setSettings] = usePersistentState("brushHogSettings", defaultBusinessSettings);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Module navigation bar - sits above the calculator's own header */}
      <nav className="bg-gray-900 text-white shadow-lg print:hidden">
        <div className="container mx-auto px-4 py-2 flex gap-2 flex-wrap items-center">
          <span className="font-bold text-green-400 mr-4">ð Brush Hog Business Suite</span>
          {[
            { key: "calculator", label: "ð§® Calculator" },
            { key: "clients", label: "ð¥ Clients" },
            { key: "quotes", label: "ð Quotes" },
            { key: "settings", label: "âï¸ Settings" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${
                view === key ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Render the active module */}
      {view === "calculator" && <BrushHogCalculator />}
      {view === "clients" && (
        <div className="container mx-auto px-4 py-8">
          <ClientsPage clients={clients} setClients={setClients} />
        </div>
      )}
      {view === "quotes" && (
        <div className="container mx-auto px-4 py-8">
          <QuotesPage quotes={quotes} setQuotes={setQuotes} clients={clients} settings={settings} />
        </div>
      )}
      {view === "settings" && (
        <div className="container mx-auto px-4 py-8">
          <SettingsPage settings={settings} setSettings={setSettings} />
        </div>
      )}
    </div>

  window.App = App;
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();).
