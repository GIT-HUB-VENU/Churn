import React from 'react';
import { Search, Menu, X } from 'lucide-react';

export const Header = ({
  datasetName = 'uploaded_dataset.csv',
  onSearchChange,
  searchTerm = '',
  mobileOpen,
  setMobileOpen,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0">
      <div className="flex items-center space-x-3 sm:space-x-4">
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 focus:outline-none"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>Current Dataset:</span>
          <span className="text-slate-900 font-semibold italic truncate max-w-[150px] sm:max-w-[220px]">
            {datasetName}
          </span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider border border-green-200">
            Model Active
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Member ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs w-44 sm:w-52 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shadow-xs">
          JD
        </div>
      </div>
    </header>
  );
};
