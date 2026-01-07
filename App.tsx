
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Globe, 
  Search, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Star, 
  Settings,
  Zap,
  Brain,
  SearchIcon,
  Home,
  Menu,
  Layout,
  BookOpen,
  Wifi,
  WifiOff,
  MapPin,
  Signal,
  Activity
} from 'lucide-react';
import { AIModelMode, Tab, Coordinates } from './types';
import { fetchAIResponse } from './services/geminiService';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { 
      id: '1', 
      title: 'New Tab', 
      url: '', 
      content: '', 
      isLoading: false, 
      mode: AIModelMode.FAST 
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [coords, setCoords] = useState<Coordinates | undefined>(undefined);
  const [latency, setLatency] = useState(24);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Monitor Internet Connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Geolocation Fetch
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn('Geolocation access denied or unavailable.')
      );
    }

    // Simulate real-time latency jitter
    const interval = setInterval(() => {
      setLatency(prev => Math.max(15, Math.min(150, prev + (Math.random() * 20 - 10))));
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTabId, activeTab.url]);

  const createTab = (initialUrl: string = '') => {
    const newTab: Tab = {
      id: Math.random().toString(36).substring(7),
      title: 'New Tab',
      url: initialUrl,
      content: '',
      isLoading: false,
      mode: AIModelMode.FAST
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleNavigate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim() || !isOnline) return;

    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      isLoading: true, 
      url: urlInput,
      title: 'Connecting...',
      isThinking: t.mode === AIModelMode.DEEP
    } : t));

    try {
      let prompt = urlInput;
      if (!urlInput.includes('.') && !urlInput.includes('://')) {
        prompt = `Search for: ${urlInput}`;
      } else {
        prompt = `Navigate to and summarize/explain the content of: ${urlInput}`;
      }

      const response = await fetchAIResponse(prompt, activeTab.mode, coords);
      
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        isLoading: false, 
        content: response.text,
        title: urlInput.substring(0, 20),
        groundingLinks: response.links,
        isThinking: false
      } : t));
    } catch (error) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        isLoading: false, 
        content: 'Network Request Failed. Please ensure your API key and connection are stable.',
        isThinking: false
      } : t));
    }
  };

  const setMode = (mode: AIModelMode) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode } : t));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Offline Alert Overlay */}
      {!isOnline && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="p-8 glass rounded-3xl text-center max-w-sm border-red-500/30">
            <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">No Internet Connection</h2>
            <p className="text-slate-400 mb-6 text-sm">Nova requires an active uplink to synchronize with global intelligence nodes.</p>
            <button 
              onClick={() => setIsOnline(navigator.onLine)} 
              className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-full font-bold text-sm transition-all"
            >
              Re-Establish Connection
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex items-center px-4 pt-2 gap-1 bg-slate-900 border-b border-slate-800">
        <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] rounded-t-lg cursor-pointer transition-all duration-200 ${
                activeTabId === tab.id 
                ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-500' 
                : 'hover:bg-slate-800/50 text-slate-500'
              }`}
            >
              <Globe className={`w-4 h-4 ${activeTabId === tab.id ? 'text-indigo-400' : 'text-slate-600'}`} />
              <span className="text-xs font-medium truncate flex-1">{tab.title || 'New Tab'}</span>
              <X 
                className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded-sm" 
                onClick={(e) => closeTab(tab.id, e)}
              />
            </div>
          ))}
        </div>
        <button 
          onClick={() => createTab()}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          <button onClick={() => handleNavigate()} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><RotateCcw className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleNavigate} className="flex-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={urlInput}
              disabled={!isOnline}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={isOnline ? "Search Nova or enter a URL" : "Offline..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600 disabled:opacity-50"
            />
            {coords && (
              <div className="absolute inset-y-0 right-3 flex items-center text-emerald-500/50">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-700">
          <button 
            onClick={() => setMode(AIModelMode.FAST)}
            className={`p-1.5 rounded-full transition-all flex items-center gap-1.5 px-3 ${activeTab.mode === AIModelMode.FAST ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-tighter">Fast</span>
          </button>
          <button 
            onClick={() => setMode(AIModelMode.SEARCH)}
            className={`p-1.5 rounded-full transition-all flex items-center gap-1.5 px-3 ${activeTab.mode === AIModelMode.SEARCH ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-tighter">Live</span>
          </button>
          <button 
            onClick={() => setMode(AIModelMode.DEEP)}
            className={`p-1.5 rounded-full transition-all flex items-center gap-1.5 px-3 ${activeTab.mode === AIModelMode.DEEP ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-tighter">Deep</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar relative">
        {!activeTab.url && !activeTab.isLoading ? (
          <div className="max-w-4xl mx-auto mt-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 inline-block p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-1000 rounded-full" />
                <Layout className="w-10 h-10 text-white relative z-10" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4 tracking-tight">
              Nova Super-Browser
            </h1>
            <p className="text-xl text-slate-400 mb-12 font-light">
              Live Connection. Instant Knowledge. Hyper-Local Results.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div onClick={() => { setUrlInput('Write a fast sort algorithm'); handleNavigate(); }} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <Zap className="w-6 h-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-200 mb-1">Instant Engine</h3>
                <p className="text-sm text-slate-500">Low-latency generation for code and logic.</p>
              </div>
              <div onClick={() => { setUrlInput('Best coffee shops within walking distance'); setMode(AIModelMode.SEARCH); handleNavigate(); }} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <MapPin className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-200 mb-1">Local Intelligence</h3>
                <p className="text-sm text-slate-500">Google Maps + Search grounding enabled.</p>
              </div>
              <div onClick={() => { setUrlInput('Future of neural interfaces in 2050'); setMode(AIModelMode.DEEP); handleNavigate(); }} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                <Brain className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-200 mb-1">High-Res Thinking</h3>
                <p className="text-sm text-slate-500">Maximum token budget for complex reasoning.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto pb-20">
            {activeTab.isLoading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className={`w-24 h-24 mb-6 rounded-3xl flex items-center justify-center ${
                  activeTab.isThinking ? 'thinking-glow bg-purple-600/20' : 'animate-pulse bg-indigo-500/10 border border-indigo-500/20'
                }`}>
                  {activeTab.mode === AIModelMode.DEEP ? (
                    <Brain className="w-12 h-12 text-purple-500 animate-bounce" />
                  ) : activeTab.mode === AIModelMode.SEARCH ? (
                    <Signal className="w-12 h-12 text-emerald-500 animate-pulse" />
                  ) : (
                    <Zap className="w-12 h-12 text-indigo-500 animate-pulse" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {activeTab.isThinking ? 'Maximum Resolution Reasoning...' : 'Connecting to Global Uplink...'}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-mono uppercase tracking-widest">
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming Data Particles</span>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab.mode === AIModelMode.FAST ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                      activeTab.mode === AIModelMode.SEARCH ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                    }`} />
                    <span>{activeTab.mode} Engine Finalized</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-700 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                    LATENCY: {latency.toFixed(0)}MS | TTL: 300
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6">
                  {activeTab.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-lg leading-8 first-letter:text-4xl first-letter:font-bold first-letter:text-indigo-400 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {activeTab.groundingLinks && activeTab.groundingLinks.length > 0 && (
                  <div className="mt-16 pt-12 border-t border-slate-800">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">
                      <BookOpen className="w-4 h-4" />
                      Live Grounding Evidence
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTab.groundingLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/40 hover:bg-slate-900 transition-all group overflow-hidden relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs text-slate-500 uppercase font-bold mb-1 tracking-tighter">Source Node {idx + 1}</span>
                            <span className="text-sm font-semibold text-slate-200 truncate block">{link.title}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-600 font-mono">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}></div>
            <span className={isOnline ? 'text-slate-400' : 'text-red-400 font-bold'}>
              {isOnline ? 'NETWORK: ONLINE' : 'NETWORK: DISCONNECTED'}
            </span>
          </div>
          <span className="hidden sm:inline">LATENCY: {latency.toFixed(0)}MS</span>
          <span className="hidden sm:inline">MODEL: {activeTab.mode.toUpperCase()}</span>
          {coords && <span className="hidden sm:inline flex items-center gap-1"><MapPin className="w-3 h-3" /> {coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 group cursor-pointer hover:text-indigo-400">
            <Signal className="w-3 h-3" />
            STRENGTH: 100%
          </span>
          <span className="hover:text-slate-400 cursor-pointer hidden md:inline">GCP NORTH-1</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
