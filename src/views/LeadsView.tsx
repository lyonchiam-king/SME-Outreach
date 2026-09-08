import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Smartphone,
  Globe,
  Star,
  X,
  ExternalLink,
  MessageSquare,
  FileCode,
  Send,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit3,
} from 'lucide-react';
import { Lead, Stage, WhatsAppReachable } from '../types';
import { api } from '../api/client';

interface LeadsViewProps {
  leads: Lead[];
  onRefresh: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ leads, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [reachFilter, setReachFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'business_name' | 'rating' | 'stage'>('business_name');
  const [sortAsc, setSortAsc] = useState(true);

  // Drawer state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [ownerNoteInput, setOwnerNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const filteredLeads = useMemo(() => {
    const leadList = Array.isArray(leads) ? leads : [];
    return leadList
      .filter((l) => {
        const matchesSearch =
          l.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
        const matchesReach =
          reachFilter === 'all' || l.whatsapp_reachable === reachFilter;

        return matchesSearch && matchesStage && matchesReach;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [leads, searchTerm, stageFilter, reachFilter, sortField, sortAsc]);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOwnerNoteInput(lead.owner_notes || '');
  };

  const handleSaveNote = async () => {
    if (!selectedLead) return;
    setSavingNote(true);
    await api.updateLeadNote(selectedLead.place_id, ownerNoteInput);
    setSavingNote(false);
    setSelectedLead({ ...selectedLead, owner_notes: ownerNoteInput });
    onRefresh();
  };

  return (
    <div id="leads-view" className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="lead-search-input"
            type="text"
            placeholder="Search leads by business name, category, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="stage-filter-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Stages</option>
              <option value="Discovered">Discovered</option>
              <option value="Researched">Researched</option>
              <option value="Site Briefed">Site Briefed</option>
              <option value="Site Built">Site Built</option>
              <option value="Email Drafted">Email Drafted</option>
              <option value="Sent">Sent</option>
              <option value="Replied">Replied</option>
              <option value="Disqualified">Disqualified</option>
            </select>
          </div>

          {/* Reachability Filter */}
          <select
            id="reachability-filter-select"
            value={reachFilter}
            onChange={(e) => setReachFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Reachability</option>
            <option value="yes">WhatsApp Confirmed (Yes)</option>
            <option value="no">No WhatsApp (No)</option>
            <option value="unknown">Unchecked (Unknown)</option>
          </select>

          {/* Sorting */}
          <button
            onClick={() => {
              if (sortField === 'business_name') setSortAsc(!sortAsc);
              else {
                setSortField('business_name');
                setSortAsc(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium text-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort Name
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div id="leads-table-card" className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Business Name &amp; Category</th>
                <th className="p-3">Address &amp; Phone</th>
                <th className="p-3 text-center">Rating</th>
                <th className="p-3">Website Status</th>
                <th className="p-3">Stage</th>
                <th className="p-3 text-center">WhatsApp</th>
                <th className="p-3">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.place_id}
                  id={`lead-row-${lead.place_id}`}
                  onClick={() => handleRowClick(lead)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="p-3 font-medium">
                    <div className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
                      {lead.business_name}
                    </div>
                    <div className="text-[11px] text-slate-500">{lead.category}</div>
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    <div className="truncate max-w-xs text-slate-700 dark:text-slate-300">{lead.address}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{lead.phone}</div>
                  </td>

                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded text-[11px]">
                      <Star className="w-3 h-3 fill-current text-amber-500" />
                      {lead.rating} ({lead.review_count})
                    </div>
                  </td>

                  <td className="p-3">
                    {lead.website_status === 'none' && (
                      <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        No Website
                      </span>
                    )}
                    {lead.website_status === 'social_only' && (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Social Only
                      </span>
                    )}
                    {lead.website_status === 'real' && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Has Site
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {lead.stage}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    {lead.whatsapp_reachable === 'yes' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Yes
                      </span>
                    )}
                    {lead.whatsapp_reachable === 'no' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3 text-slate-400" /> No
                      </span>
                    )}
                    {lead.whatsapp_reachable === 'unknown' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        <HelpCircle className="w-3 h-3" /> Unchecked
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-slate-500 text-xs">{lead.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Slide-over Drawer */}
      {selectedLead && (
        <div id="lead-detail-drawer" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 shadow-2xl border-l border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  Lead Detail Drawer
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedLead.business_name}
                </h2>
              </div>
              <button
                id="close-lead-drawer-btn"
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLead.category}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block font-medium">Current Stage</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{selectedLead.stage}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block font-medium">Phone &amp; E.164</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLead.phone}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block font-medium">Rating</span>
                <span className="font-bold text-amber-600">★ {selectedLead.rating} ({selectedLead.review_count} reviews)</span>
              </div>
            </div>

            {/* Manual Owner Notes */}
            <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-teal-600" /> Manual Owner Notes (Human Only)
              </h3>
              <textarea
                id="owner-notes-textarea"
                rows={3}
                value={ownerNoteInput}
                onChange={(e) => setOwnerNoteInput(e.target.value)}
                placeholder="Add manual call notes, owner preferences, or follow-up instructions..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end">
                <button
                  id="save-owner-note-btn"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-semibold"
                >
                  {savingNote ? 'Saving...' : 'Save Manual Note'}
                </button>
              </div>
            </div>

            {/* Address & Links */}
            <div className="text-xs space-y-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider block">Address</span>
              <p className="text-slate-700 dark:text-slate-300">{selectedLead.address}</p>
              {selectedLead.website_url && (
                <a
                  href={selectedLead.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {selectedLead.website_url} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
