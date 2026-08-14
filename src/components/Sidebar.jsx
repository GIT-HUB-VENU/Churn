import React from 'react';
import { LayoutDashboard, Users, BarChart3, ShieldCheck, SlidersHorizontal, Sparkles, HeartPulse } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const analyticsNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Member Directory', icon: Users },
    { id: 'retention', label: 'Retention Advisor', icon: Sparkles },
    { id: 'model', label: 'Model Insights', icon: BarChart3 },
  ];

  const systemNav = [
    { id: 'settings', label: 'Data & Settings', icon: SlidersHorizontal },
    { id: 'responsible_ai', label: 'Responsible AI', icon: ShieldCheck },
  ];

  const handleSelect = (tab) => {
    setActiveTab(tab);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-56 bg-slate-900 flex flex-col h-full text-slate-300 border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-blue-400 font-bold text-lg tracking-tight leading-none">CareRetain AI</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
              Retention Advisor
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-6">
          {/* Analytics Section */}
          <div>
            <div className="px-5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Analytics
            </div>
            <div className="mt-1 space-y-0.5">
              {analyticsNav.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center px-5 py-2.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-3 shrink-0 ${
                        isActive ? 'bg-blue-300' : 'bg-slate-600'
                      }`}
                    ></span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Section */}
          <div>
            <div className="px-5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              System
            </div>
            <div className="mt-1 space-y-0.5">
              {systemNav.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center px-5 py-2.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-3 shrink-0 ${
                        isActive ? 'bg-blue-300' : 'bg-slate-600'
                      }`}
                    ></span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Responsible AI Disclaimer */}
        <div className="p-4 bg-slate-950 text-[10px] border-t border-slate-800 opacity-70 leading-relaxed space-y-1">
          <div className="font-bold uppercase tracking-wider text-slate-400">Responsible AI</div>
          <div className="text-slate-400">
            Decision-support tool. Predictions are probabilistic. Not a medical diagnosis.
          </div>
        </div>
      </aside>
    </>
  );
};
