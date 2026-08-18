import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { MemberIntelligencePage } from './pages/MemberIntelligencePage';
import { ModelInsightsPage } from './pages/ModelInsightsPage';
import { RetentionAdvisorPage } from './pages/RetentionAdvisorPage';
import { ResponsibleAiPage } from './pages/ResponsibleAiPage';
import { SettingsPage } from './pages/SettingsPage';
import { MemberDetailModal } from './components/MemberDetailModal';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [activeDatasetName, setActiveDatasetName] = useState('');

  useEffect(() => {
    fetchHealth()
      .then((res) => {
        if (res && res.datasetName) {
          setActiveDatasetName(res.datasetName);
        }
      })
      .catch((err) => console.warn('Could not fetch health dataset name:', err));
  }, [refreshKey]);

  const handleRefreshData = (newDatasetName) => {
    if (newDatasetName && typeof newDatasetName === 'string') {
      setActiveDatasetName(newDatasetName);
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleGlobalSearch = (term) => {
    setGlobalSearchTerm(term);
    if (term.trim() && activeTab !== 'members') {
      setActiveTab('members');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Right Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          datasetName={activeDatasetName}
          searchTerm={globalSearchTerm}
          onSearchChange={handleGlobalSearch}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onSelectMember={(id) => setSelectedMemberId(id)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onDatasetNameChange={(name) => setActiveDatasetName(name)}
            />
          )}

          {activeTab === 'members' && (
            <MemberIntelligencePage
              key={refreshKey}
              onSelectMember={(id) => setSelectedMemberId(id)}
            />
          )}

          {activeTab === 'model' && (
            <ModelInsightsPage key={refreshKey} />
          )}

          {activeTab === 'retention' && (
            <RetentionAdvisorPage
              key={refreshKey}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectMember={(id) => setSelectedMemberId(id)}
            />
          )}

          {activeTab === 'responsible_ai' && (
            <ResponsibleAiPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage onRefreshData={handleRefreshData} />
          )}
        </main>
      </div>

      {/* Member Risk & Retention Diagnostic Modal */}
      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}
