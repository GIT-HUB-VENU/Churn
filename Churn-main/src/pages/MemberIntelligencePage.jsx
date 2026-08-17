import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, Eye, Users, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchMembers } from '../services/api';

export const MemberIntelligencePage = ({ onSelectMember }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('churnProbability');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = () => {
    setLoading(true);
    fetchMembers({
      search,
      riskLevel: riskFilter,
      planType: planFilter,
      page,
      limit: 15,
      sortBy,
      sortOrder,
    })
      .then((res) => {
        setMembers(res.members || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching members');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [search, riskFilter, planFilter, page, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Member Intelligence Directory</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
              {totalCount} Total Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filter, search, and inspect individual member risk profiles, plan utilization, and retention indicators.
          </p>
        </div>
      </div>

      {/* Control Bar: Search & Filter Inputs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Member ID or Plan Type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Level Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2">Risk:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
              <button
                key={risk}
                onClick={() => {
                  setRiskFilter(risk);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  riskFilter === risk
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>

          {/* Plan Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL">All Plans</option>
              <option value="HMO">HMO</option>
              <option value="PPO">PPO</option>
              <option value="EPO">EPO</option>
              <option value="POS">POS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-sm font-medium text-slate-600">Fetching member records...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p>{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-semibold">No member records match the selected criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search filters or selecting 'ALL' risk levels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('Member_ID')}>
                    <div className="flex items-center gap-1">
                      Member ID <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Demographics</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('Plan_Type')}>
                    <div className="flex items-center gap-1">
                      Plan & Tier <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('Tenure_Months')}>
                    <div className="flex items-center gap-1">
                      Tenure <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('Unresolved_Service_Cases')}>
                    <div className="flex items-center gap-1">
                      Unresolved Cases <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('Out_Of_Pocket_Change_Pct')}>
                    <div className="flex items-center gap-1">
                      Cost Change <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 text-center" onClick={() => handleSort('churnProbability')}>
                    <div className="flex items-center justify-center gap-1">
                      Risk Score <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {members.map((m) => (
                  <tr key={m.Member_ID} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{m.Member_ID}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {m.Age} yrs, {m.Gender}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {m.Plan_Type} <span className="text-slate-500 font-normal">({m.Plan_Tier})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{m.Tenure_Months} mos</td>
                    <td className="py-3.5 px-4">
                      {Number(m.Unresolved_Service_Cases || 0) > 0 ? (
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          {m.Unresolved_Service_Cases} Open
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {Number(m.Out_Of_Pocket_Change_Pct || 0) > 20 ? (
                        <span className="text-red-600 font-bold">+{m.Out_Of_Pocket_Change_Pct}%</span>
                      ) : Number(m.Out_Of_Pocket_Change_Pct || 0) > 0 ? (
                        <span className="text-amber-600 font-semibold">+{m.Out_Of_Pocket_Change_Pct}%</span>
                      ) : (
                        <span className="text-slate-500">{m.Out_Of_Pocket_Change_Pct || 0}%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold shadow-2xs ${
                        m.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                        m.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {((m.churnProbability || 0) * 100).toFixed(1)}% ({m.riskLevel})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectMember(m.Member_ID)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} total members)
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
