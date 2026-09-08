import React from 'react';
import {
  LayoutDashboard,
  Users,
  Radio,
  FileCode,
  Hammer,
  Send,
  Compass,
  Settings,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { Summary, WhatsAppStatus, ModelSettings } from '../types';

export type NavTab =
  | 'today'
  | 'leads'
  | 'reachability'
  | 'briefs'
  | 'build'
  | 'send'
  | 'campaign'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  summary: Summary | null;
  whatsappStatus: WhatsAppStatus | null;
  modelSettings: ModelSettings | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenOnboarding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  summary,
  whatsappStatus,
  modelSettings,
  darkMode,
  setDarkMode,
  onOpenOnboarding,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'today',
      label: 'Today',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: <Users className="w-4 h-4" />,
      badge: summary?.total,
    },
    {
      id: 'reachability',
      label: 'Reachability',
      icon: <Radio className="w-4 h-4" />,
      badge: summary?.whatsapp_waiting,
    },
    {
      id: 'briefs',
      label: 'Briefs',
      icon: <FileCode className="w-4 h-4" />,
      badge: summary?.awaiting_approval,
    },
    {
      id: 'build',
      label: 'Build',
      icon: <Hammer className="w-4 h-4" />,
      badge: summary?.approved_unbuilt,
    },
    {
      id: 'send',
      label: 'Send',
      icon: <Send className="w-4 h-4" />,
      badge: summary?.to_draft,
    },
    {
      id: 'campaign',
      label: 'Campaign',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const sheetOk = !!summary?.sheet_url;
  const keysOk = !!modelSettings?.key_set;
  const relayOk = !!whatsappStatus?.connected;
  const allSetup = sheetOk && keysOk && relayOk;

  return (
    <aside
      id="app-sidebar"
      className={`w-64 border-r flex flex-col shrink-0 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}
    >
      {/* Brand Header */}
      <div id="sidebar-header" className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            O
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight tracking-tight">Outreach Studio</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">SME Pipeline v1.2</p>
          </div>
        </div>
        <button
          id="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Setup Health Summary Box */}
      <div id="sidebar-setup-box" className="p-3 mx-3 my-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Setup Status</span>
          <button
            id="setup-checklist-link"
            onClick={onOpenOnboarding}
            className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            Checklist <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Google Sheet</span>
            {sheetOk ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                <AlertCircle className="w-3 h-3" /> Needed
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Model & API Keys</span>
            {keysOk ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Set
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                <AlertCircle className="w-3 h-3" /> Needed
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">WhatsApp Relay</span>
            {relayOk ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Radio className="w-3 h-3 text-slate-400" /> Disconnected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Funnel */}
      <nav id="sidebar-nav" className="flex-1 px-3 space-y-1 py-1 overflow-y-auto">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Outreach Funnel
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {modelSettings?.provider ? modelSettings.provider.toUpperCase() : 'GEMINI'}
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {modelSettings?.model || '3.8-flash'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
          Pipeline runs locally. Sheet & WhatsApp stay in your private environment.
        </p>
      </div>
    </aside>
  );
};
