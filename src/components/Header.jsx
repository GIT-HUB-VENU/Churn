import React, { useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';

export const Header = ({
  activeTab,
  setActiveTab,
  datasetName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'members', label: 'MEMBER DIRECTORY' },
    { id: 'retention', label: 'RETENTION ADVISOR' },
    { id: 'model', label: 'MODEL INSIGHTS' },
    { id: 'settings', label: 'DATA & SETTINGS' },
    { id: 'responsible_ai', label: 'RESPONSIBLE AI' },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-4 mb-8 sm:mb-10 z-40 w-full rounded-full bg-transparent backdrop-blur-md border border-stone-300/60 shadow-2xs transition-all">
      <div className="px-4 sm:px-6 h-12 sm:h-13 flex items-center justify-between">
        
        {/* Desktop Navigation Links — Left-Aligned Floating Pill Navigation */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5 h-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all ${
                  isActive
                    ? 'bg-teal-50/90 text-teal-800 font-extrabold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Area: Restored Green/Turquoise Dataset Status Block */}
        <div className="hidden md:flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-stone-500 font-normal">Dataset:</span>
            <span className="italic truncate max-w-[130px] text-emerald-900 font-semibold">
              {datasetName || 'Default_dataset.csv'}
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded text-[9px] uppercase font-mono font-extrabold ml-0.5">
              Active
            </span>
          </div>
        </div>

        {/* Mobile Header Layout */}
        <div className="flex md:hidden items-center justify-between w-full px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold tracking-wider text-teal-900 uppercase">
              {navItems.find((n) => n.id === activeTab)?.label || 'NAVIGATION'}
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-stone-600 hover:text-stone-900 focus:outline-none rounded-full hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/80 bg-white/95 backdrop-blur-md rounded-b-2xl px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150 mt-1">
          <div className="pb-2 mb-2 border-b border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Dataset Status:</span>
            <span className="font-mono font-bold text-emerald-700 text-[11px] truncate max-w-[180px]">
              {datasetName || 'Default_dataset.csv'}
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold tracking-wider transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-600'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
