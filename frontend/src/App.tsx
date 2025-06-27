import React, { useEffect, useState } from 'react';
import { Search, Settings, Clock, TrendingUp, Package, Coins, Filter, X, Menu, Check, ArrowDown } from 'lucide-react';

interface Listing {
  pricePerUnit: number;
  quantity: number;
  worldName: string;
}

interface Materia {
  id: number;
  name: string;
  stat: string;
  stat_increase: number;
  average_gil: number;
  scrip_cost: number;
  scrip_type: string;
  advanced_melding: boolean;
  total_quantity: number;
  listing_count: number;
  cheapest_listings: Listing[];
  color: string;
  highlighted: boolean;
  historical_avg: number;
}

const App: React.FC = () => {
  const [materia, setMateria] = useState<Materia[]>([]);
  const [world, setWorld] = useState('Aether');
  const [sortKey, setSortKey] = useState('average_gil');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [allStats, setAllStats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timingOpen, setTimingOpen] = useState(false);
  const [timing, setTiming] = useState<Record<string, any>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightPct, setHighlightPct] = useState(105);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use real API endpoints
  useEffect(() => {
    setLoading(true);
    fetch(`/materia?world=${world}`)
      .then(res => res.json())
      .then((data) => {
        setMateria(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching materia data:', error);
        setLoading(false);
      });
  }, [world]);

  useEffect(() => {
    const allUniqueStats = Array.from(new Set(materia.map(m => m.stat)));
    setAllStats(allUniqueStats);
    if (selectedStats.length === 0) {
      setSelectedStats(allUniqueStats.filter((s: string) => ["CP", "Control", "Craftsmanship"].includes(s)));
    }
  }, [materia]);

  useEffect(() => {
    if (timingOpen) {
      fetch('/debug/timing')
        .then(res => res.json())
        .then((data) => setTiming(data))
        .catch((error) => {
          console.error('Error fetching timing data:', error);
        });
    }
  }, [timingOpen]);

  const toggleStat = (stat: string) => {
    setSelectedStats((prev) =>
      prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
    );
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleRowClick = (item: number) => {
    window.open(`https://universalis.app/market/${item.toString()}`, '_blank');
  };

  const getSortIcon = (column: string) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const statColumns = selectedStats.map((stat) => {
    const filtered = materia
      .filter((m) => m.stat === stat)
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1;
        const valA = (a as any)[sortKey] ?? (sortKey === 'name' ? '' : 0);
        const valB = (b as any)[sortKey] ?? (sortKey === 'name' ? '' : 0);
        return valA > valB ? direction : valA < valB ? -direction : 0;
      });

    return (
              <div key={stat} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full min-w-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: `${filtered[0]?.color}10` }}>
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: filtered[0]?.color }}>
            <div 
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: filtered[0]?.color }}
            ></div>
            {stat}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  onClick={() => handleSort('name')} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Name {getSortIcon('name')}
                </th>
                <th 
                  onClick={() => handleSort('stat_increase')} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  +Stat {getSortIcon('stat_increase')}
                </th>
                <th 
                  onClick={() => handleSort('average_gil')} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Avg Price {getSortIcon('average_gil')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Scrip Cost
                </th>
                <th 
                  onClick={() => handleSort('cheapest_listings')} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                  Cheapest {getSortIcon('cheapest_listings')}
                </th>
                <th 
                  onClick={() => handleSort('total_quantity')} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Quantity {getSortIcon('total_quantity')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((m) => {
                const isHighlighted = m.historical_avg && m.average_gil <= m.historical_avg * (highlightPct / 100);
                return (
                  <tr
                    key={m.id}
                    onClick={() => handleRowClick(m.id)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isHighlighted
                        ? 'bg-green-200 dark:bg-green-800/40 hover:bg-green-300 dark:hover:bg-green-700/50 border-l-4 border-green-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={m.cheapest_listings?.map(l => `${l.quantity} × ${l.pricePerUnit.toLocaleString()} gil @ ${l.worldName}`).join('\n')}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: m.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">
                      +{m.stat_increase}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Coins size={16} className="mr-1 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {m.average_gil?.toLocaleString() ?? 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                          m.scrip_type === 'orange' 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                            : m.scrip_type === 'purple'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {m.scrip_cost ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <ArrowDown size={16} className="mr-1 text-green-500 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {(m.cheapest_listings?.[0]?.pricePerUnit || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Package size={16} className="mr-1 text-blue-500 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {m.total_quantity ?? 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Materia Market Dashboard
                </h1>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="World"
                  value={world}
                  onChange={(e) => setWorld(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <button
                onClick={() => setTimingOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Clock size={16} />
                <span>Timing</span>
              </button>
              
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="World"
                value={world}
                onChange={(e) => setWorld(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimingOpen(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Clock size={16} />
                <span>Timing</span>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Filter */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Stats</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {allStats.map((stat) => (
              <button
                key={stat}
                onClick={() => toggleStat(stat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  selectedStats.includes(stat)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-2 border-blue-500 shadow-md transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {selectedStats.includes(stat) && (
                  <Check size={16} className="inline mr-1 text-blue-600 dark:text-blue-400" />
                )}
                {stat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid Layout */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading materia data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 auto-rows-max">
            {statColumns}
          </div>
        )}
      </main>

      {/* Timing Modal */}
      {timingOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Clock size={20} />
                <span>API Timing</span>
              </h3>
              <button
                onClick={() => setTimingOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(timing).map(([k, v]: [string, any]) => (
                <div key={k} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="font-medium text-gray-900 dark:text-white">{k}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {v.calls} calls • Avg: {v.avg_time?.toFixed(2)}s • Total: {v.total_time?.toFixed(2)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Settings size={20} />
                <span>Settings</span>
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Highlight Threshold: {highlightPct}% of historical average
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="120"
                    step="1"
                    value={highlightPct}
                    onChange={(e) => setHighlightPct(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>80%</span>
                    <span>100%</span>
                    <span>120%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Items are highlighted when current price is at or below this percentage of the historical average.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;