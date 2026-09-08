import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Terminal,
  RotateCw,
  DollarSign,
  TrendingUp,
  Sliders,
  FileCode,
  Hammer,
  Send,
  Search,
} from 'lucide-react';
import { Summary, RunLog, Stage } from '../types';
import { api } from '../api/client';
import { NavTab } from '../components/Sidebar';

interface TodayViewProps {
  summary: Summary | null;
  runLog: RunLog | null;
  onRefresh: () => void;
  setActiveTab: (tab: NavTab) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  summary,
  runLog,
  onRefresh,
  setActiveTab,
}) => {
  const [batchLimit, setBatchLimit] = useState(10);
  const [startingRun, setStartingRun] = useState(false);

  const handleRunBatch = async (what: string) => {
    setStartingRun(true);
    await api.runBatch(what, batchLimit);
    setStartingRun(false);
    onRefresh();
  };

  const total = summary?.total || 1;
  const stages: { stage: Stage; count: number; color: string }[] = [
    { stage: 'Discovered', count: summary?.by_stage?.Discovered || 0, color: 'bg-slate-500' },
    { stage: 'Researched', count: summary?.by_stage?.Researched || 0, color: 'bg-blue-500' },
    { stage: 'Site Briefed', count: summary?.by_stage?.['Site Briefed'] || 0, color: 'bg-indigo-500' },
    { stage: 'Site Built', count: summary?.by_stage?.['Site Built'] || 0, color: 'bg-teal-500' },
    { stage: 'Email Drafted', count: summary?.by_stage?.['Email Drafted'] || 0, color: 'bg-amber-500' },
    { stage: 'Sent', count: summary?.by_stage?.Sent || 0, color: 'bg-emerald-500' },
    { stage: 'Replied', count: summary?.by_stage?.Replied || 0, color: 'bg-green-600' },
  ];

  const todoItems = [
    {
      id: 'briefs',
      title: 'Site Briefs Ready for Review',
      count: summary?.awaiting_approval || 0,
      description: 'Review generated website angles, praise signals & Lovable prompts.',
      actionLabel: 'Review Brief Queue',
      tab: 'briefs' as NavTab,
      costHint: '0¢ (Approval is free)',
      icon: <FileCode className="w-4 h-4 text-indigo-500" />,
      urgent: (summary?.awaiting_approval || 0) > 0,
    },
    {
      id: 'build',
      title: 'Approved Sites to Build',
      count: summary?.approved_unbuilt || 0,
      description: 'Copy prompt to site builder & record preview URLs.',
      actionLabel: 'Open Build Queue',
      tab: 'build' as NavTab,
      costHint: 'Free / Builder Subscription',
      icon: <Hammer className="w-4 h-4 text-teal-500" />,
      urgent: (summary?.approved_unbuilt || 0) > 0,
    },
    {
      id: 'send',
      title: 'Outreach Messages to Send',
      count: summary?.to_draft || 0,
      description: 'Leads with built sites ready for WhatsApp sending.',
      actionLabel: 'Open Send Queue',
      tab: 'send' as NavTab,
      costHint: 'Free via WhatsApp Relay',
      icon: <Send className="w-4 h-4 text-emerald-500" />,
      urgent: (summary?.to_draft || 0) > 0,
    },
    {
      id: 'research',
      title: 'Discovered Leads Needing Research',
      count: summary?.to_research || 0,
      description: 'Run deep search for customer praise, tone & social links.',
      actionLabel: 'Run Lead Research',
      runAction: 'research',
      costHint: 'about 0.2¢ each',
      icon: <Search className="w-4 h-4 text-blue-500" />,
      urgent: false,
    },
  ];

  return (
    <div id="today-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Today's Outreach Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized tasks, funnel health metrics, and morning batch execution.
          </p>
        </div>

        {/* Morning Batch Trigger */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Batch Limit:</span>
            <input
              id="batch-limit-input"
              type="number"
              min={1}
              max={50}
              value={batchLimit}
              onChange={(e) => setBatchLimit(parseInt(e.target.value) || 10)}
              className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-center font-bold"
            />
          </div>

          <button
            id="run-morning-batch-btn"
            onClick={() => handleRunBatch('full')}
            disabled={startingRun || !!runLog?.running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {runLog?.running ? 'Batch Running...' : "Run This Morning's Batch"}
          </button>
        </div>
      </div>

      {/* Top Counts Row */}
      <div id="metric-cards-row" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Leads
          </div>
          <div className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100">
            {summary?.total || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Discovered
          </div>
          <div className="text-xl font-bold mt-1 text-slate-700 dark:text-slate-300">
            {summary?.by_stage?.Discovered || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase">
            Researched
          </div>
          <div className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
            {summary?.by_stage?.Researched || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase">
            Briefed
          </div>
          <div className="text-xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
            {summary?.by_stage?.['Site Briefed'] || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-teal-600 dark:text-teal-400 uppercase">
            Built
          </div>
          <div className="text-xl font-bold mt-1 text-teal-600 dark:text-teal-400">
            {summary?.by_stage?.['Site Built'] || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase">
            Drafted
          </div>
          <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {summary?.by_stage?.['Email Drafted'] || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">
            Sent
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {summary?.by_stage?.Sent || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-green-600 dark:text-green-400 uppercase">
            Replied
          </div>
          <div className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
            {summary?.by_stage?.Replied || 0}
          </div>
        </div>
      </div>

      {/* Funnel Visualization Chart */}
      <div id="funnel-visualization-card" className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" /> Pipeline Stage Funnel & Drop-Off
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual lead distribution across progression stages.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Disqualified: {summary?.disqualified || 0} leads
          </span>
        </div>

        <div className="space-y-2.5">
          {stages.map((item, idx) => {
            const pct = Math.round((item.count / total) * 100);
            const prevCount = idx > 0 ? stages[idx - 1].count : total;
            const conversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;

            return (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-700 dark:text-slate-300">{item.stage}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    {idx > 0 && (
                      <span>Step Conv: <strong className="text-slate-700 dark:text-slate-300">{conversion}%</strong></span>
                    )}
                    <span className="w-10 text-right font-semibold text-slate-600 dark:text-slate-400">{pct}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    className={`${item.color} h-full transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prioritized To-Do List */}
      <div id="todo-list-section" className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">
          Prioritized Action Queue
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todoItems.map((todo) => (
            <div
              key={todo.id}
              className={`p-4 rounded-xl border transition-all ${
                todo.urgent
                  ? 'bg-white dark:bg-slate-900 border-teal-500/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {todo.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {todo.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {todo.count} pending
                      </span>
                      {/* Cost Hint Badge */}
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700 flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />
                        {todo.costHint}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                {todo.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {todo.tab ? (
                  <button
                    onClick={() => setActiveTab(todo.tab!)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {todo.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleRunBatch(todo.runAction!)}
                    disabled={startingRun}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition"
                  >
                    {todo.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Log Console */}
      <div id="live-log-console" className="p-4 rounded-xl border bg-slate-950 text-slate-200 border-slate-800 font-mono text-xs shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200">Live Execution Log</span>
            {runLog?.running ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded">
                <RotateCw className="w-3 h-3 animate-spin" /> Running ({runLog.running})
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                Idle
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">Auto-scrolling</span>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto leading-relaxed text-slate-300">
          {runLog?.lines?.map((line, idx) => (
            <div key={idx} className="hover:bg-slate-900/60 px-1 rounded">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
