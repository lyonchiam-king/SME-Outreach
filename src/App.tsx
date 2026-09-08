import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { OnboardingBanner } from './components/OnboardingBanner';
import { TodayView } from './views/TodayView';
import { LeadsView } from './views/LeadsView';
import { ReachabilityView } from './views/ReachabilityView';
import { BriefsQueueView } from './views/BriefsQueueView';
import { BuildQueueView } from './views/BuildQueueView';
import { SendQueueView } from './views/SendQueueView';
import { CampaignView } from './views/CampaignView';
import { SettingsView } from './views/SettingsView';
import { Summary, RunLog, WhatsAppStatus, ModelSettings, Lead } from './types';
import { api } from './api/client';
import { ExternalLink, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [darkMode, setDarkMode] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(true);

  // Core Data State
  const [summary, setSummary] = useState<Summary | null>(null);
  const [runLog, setRunLog] = useState<RunLog | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  const fetchCoreData = useCallback(async () => {
    const [sRes, lRes, wRes, mRes, leadsRes] = await Promise.all([
      api.getSummary(),
      api.getLog(),
      api.getWhatsAppStatus(),
      api.getModel(),
      api.getLeads(),
    ]);

    if (sRes.data) setSummary(sRes.data);
    if (lRes.data) setRunLog(lRes.data);
    if (wRes.data) setWhatsappStatus(wRes.data);
    if (mRes.data) setModelSettings(mRes.data);
    if (leadsRes.data) {
      const leadsArray = Array.isArray(leadsRes.data)
        ? leadsRes.data
        : leadsRes.data.leads || [];
      setLeads(leadsArray);
    }
  }, []);

  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  // Polling for live logs if a batch is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (runLog?.running) {
      interval = setInterval(fetchCoreData, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runLog?.running, fetchCoreData]);

  // Handle dark mode DOM class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div
      id="app-root"
      className={`min-h-screen flex font-sans antialiased transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={summary}
        whatsappStatus={whatsappStatus}
        modelSettings={modelSettings}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenOnboarding={() => setOnboardingOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Header */}
        <header
          id="top-app-header"
          className="sticky top-0 z-30 px-6 py-3.5 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200 uppercase">
              {activeTab} Overview
            </span>

            {summary?.sheet_url && (
              <a
                href={summary.sheet_url}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold hover:underline"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Sheet Connected{' '}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="quick-start-toggle-btn"
              onClick={() => setOnboardingOpen(!onboardingOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 rounded-lg text-xs font-semibold hover:bg-teal-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              {onboardingOpen ? 'Hide Setup' : '3-Step Setup Checklist'}
            </button>
          </div>
        </header>

        {/* Inner Content Padding */}
        <div className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {/* Onboarding Banner */}
          <OnboardingBanner
            summary={summary}
            modelSettings={modelSettings}
            whatsappStatus={whatsappStatus}
            onRefresh={fetchCoreData}
            isOpen={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
          />

          {/* Tab Views */}
          {activeTab === 'today' && (
            <TodayView
              summary={summary}
              runLog={runLog}
              onRefresh={fetchCoreData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView leads={leads} onRefresh={fetchCoreData} />
          )}

          {activeTab === 'reachability' && <ReachabilityView />}

          {activeTab === 'briefs' && <BriefsQueueView />}

          {activeTab === 'build' && <BuildQueueView />}

          {activeTab === 'send' && (
            <SendQueueView
              whatsappStatus={whatsappStatus}
              onRefresh={fetchCoreData}
            />
          )}

          {activeTab === 'campaign' && <CampaignView />}

          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

export default App;
