import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';
import { ReachabilityResponse } from '../types';
import { api } from '../api/client';

export const ReachabilityView: React.FC = () => {
  const [data, setData] = useState<ReachabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'verified' | 'rejected' | 'waiting'>('verified');

  const loadData = async () => {
    setLoading(true);
    const res = await api.getReachability();
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBatchCheck = async () => {
    setChecking(true);
    await api.checkWhatsAppBatch();
    setChecking(false);
    loadData();
  };

  if (loading) {
    return (
      <div id="reachability-loading" className="p-8 text-center text-slate-500 animate-pulse">
        Loading WhatsApp reachability stats...
      </div>
    );
  }

  const counts = data?.counts || { verified: 0, rejected: 0, waiting: 0, buildable: 0 };

  return (
    <div id="reachability-view" className="space-y-6">
      {/* Summary Highlight Box */}
      <div className="p-5 rounded-xl border bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4" /> Reachability &amp; Conversion Economics
            </div>
            {/* The CRITICAL stat: "N will be built" */}
            <h1 className="text-2xl font-extrabold text-white">
              <span className="text-emerald-400">{counts.buildable} Leads</span> Will Be Built
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              <strong>Notice:</strong> "Buildable leads" includes both WhatsApp-confirmed leads{' '}
              <span className="text-emerald-300">({counts.verified})</span> AND leads with no WhatsApp but a verified email address.{' '}
              No spend is wasted.
            </p>
          </div>

          <button
            id="check-whatsapp-batch-btn"
            onClick={handleBatchCheck}
            disabled={checking || counts.waiting === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking
              ? 'Checking WhatsApp Socket...'
              : `Check WhatsApp (${counts.waiting} Unchecked)`}
          </button>
        </div>
      </div>

      {/* Group Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          id="reachability-tab-verified"
          onClick={() => setActiveTab('verified')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
            activeTab === 'verified'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Confirmed on WhatsApp ({counts.verified})
        </button>

        <button
          id="reachability-tab-rejected"
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
            activeTab === 'rejected'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          No WhatsApp ({counts.rejected})
        </button>

        <button
          id="reachability-tab-waiting"
          onClick={() => setActiveTab('waiting')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
            activeTab === 'waiting'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Not Yet Checked ({counts.waiting})
        </button>
      </div>

      {/* List Table for Selected Group */}
      <div id="reachability-table-card" className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Business Name</th>
                <th className="p-3">Stored Phone</th>
                <th className="p-3">E.164 Dialled Format</th>
                <th className="p-3">Email Status</th>
                <th className="p-3">Build Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(data?.[activeTab] || []).map((entry) => (
                <tr key={entry.lead_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                    {entry.business_name}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    {entry.phone}
                  </td>
                  <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {entry.e164_phone}
                  </td>
                  <td className="p-3">
                    {entry.email_found ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        <Mail className="w-3 h-3" /> {entry.email_found}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No email found</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                    {entry.buildable_reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
