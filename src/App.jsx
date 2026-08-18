import React, { useEffect, useState } from 'react';
import { HeartPulse } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#F2F0EA] font-sans text-stone-800 flex flex-col antialiased relative">
      {/* 50px Left-Aligned Container Wrapper */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-[50px] py-4 sm:py-6 flex-1 flex flex-col relative">
        
        {/* Floating Horizontal Header Navigation — Top Z-Layer (z-40) */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          datasetName={activeDatasetName}
          searchTerm={globalSearchTerm}
          onSearchChange={handleGlobalSearch}
        />

        {/* FIXED BACKGROUND BRANDING TITLE — Fixed Position Layer (z-0), 400px Left Spacing */}
        <div className="fixed top-24 sm:top-28 left-4 sm:left-[400px] z-0 pointer-events-none flex items-center space-x-3 sm:space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <HeartPulse className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-none">
              CareRetain AI
            </h1>
            <p className="text-xs uppercase tracking-widest font-extrabold text-teal-800 mt-1">
              Member Retention Advisor & Analytics
            </p>
          </div>
        </div>

        {/* Main Content Body — Higher Z-Layer (z-10) Scrolling On Top of Fixed Title */}
        <main className="flex-1 w-full relative z-10 pt-20 sm:pt-24">
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
