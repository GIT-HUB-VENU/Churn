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
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-56 bg-white flex flex-col h-full text-stone-700 border-r border-stone-200/80 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-100 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-teal-700 flex items-center justify-center text-white font-bold shadow-xs">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-teal-900 font-bold text-base tracking-tight leading-none">CareRetain AI</div>
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-1">
              Retention Advisor
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 py-5 overflow-y-auto space-y-6">
          {/* Analytics Section */}
          <div>
            <div className="px-5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Analytics
            </div>
            <div className="mt-1.5 space-y-0.5">
              {analyticsNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-50/90 text-teal-900 font-semibold border-l-4 border-teal-600 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-3 shrink-0 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Section */}
          <div>
            <div className="px-5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              System
            </div>
            <div className="mt-1.5 space-y-0.5">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center px-5 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-50/90 text-teal-900 font-semibold border-l-4 border-teal-600 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-3 shrink-0 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Responsible AI Disclaimer */}
        <div className="p-4 bg-stone-50/80 text-[10px] border-t border-stone-200/80 leading-relaxed space-y-1">
          <div className="font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            Responsible AI
          </div>
          <div className="text-stone-500">
            Decision-support tool. Predictions are probabilistic. Not a medical diagnosis.
          </div>
        </div>
      </aside>
    </>
  );
};
