import React, { useState, useEffect } from 'react';
import {
  Hammer,
  Copy,
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon,
  Save,
  Globe,
  Sparkles,
} from 'lucide-react';
import { BuildItem } from '../types';
import { api } from '../api/client';

export const BuildQueueView: React.FC = () => {
  const [queue, setQueue] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const res = await api.getBuildQueue();
    if (res.data?.queue) {
      setQueue(res.data.queue);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleCopyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveBuild = async (lead_id: string) => {
    const url = urlInputs[lead_id];
    if (!url || !url.startsWith('http')) {
      alert('Please enter a valid website URL starting with http:// or https://');
      return;
    }

    setSavingMap((prev) => ({ ...prev, [lead_id]: true }));
    await api.recordBuild(lead_id, url);
    setSavingMap((prev) => ({ ...prev, [lead_id]: false }));
    loadQueue();
  };

  if (loading) {
    return (
      <div id="build-loading" className="p-8 text-center text-slate-500 animate-pulse">
        Loading build queue...
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div id="build-empty-card" className="p-12 text-center rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          No Pending Sites to Build
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          All approved briefs have been built and assigned preview URLs. Go to the Briefs queue to approve more briefs.
        </p>
      </div>
    );
  }

  return (
    <div id="build-queue-view" className="space-y-6">
      <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-teal-600" /> Build Queue ({queue.length} Approved Sites)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Copy prompt to site builder, build the demo, and paste back the preview URL.
          </p>
        </div>

        <a
          href="https://lovable.dev"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          Open Lovable Builder <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="space-y-4">
        {queue.map((item) => {
          const inputVal = urlInputs[item.lead_id] || '';
          const isSaving = savingMap[item.lead_id] || false;

          return (
            <div
              key={item.lead_id}
              id={`build-item-${item.lead_id}`}
              className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left Column: Details & Prompt */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.business_name}
                    </h2>
                    <p className="text-xs text-slate-500">{item.address}</p>
                  </div>

                  <button
                    onClick={() => handleCopyPrompt(item.lead_id, item.lovable_prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md shadow-xs transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === item.lead_id ? 'Copied Prompt!' : 'Copy Prompt'}
                  </button>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg text-teal-200 font-mono text-xs max-h-36 overflow-y-auto border border-slate-800 leading-relaxed">
                  {item.lovable_prompt}
                </div>
              </div>

              {/* Right Column: Record Preview URL */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-600" /> Record Built Preview URL
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Paste the published preview link (e.g. https://biz-name.lovable.app)
                  </p>

                  <input
                    type="url"
                    placeholder="https://business-name.lovable.app"
                    value={inputVal}
                    onChange={(e) =>
                      setUrlInputs((prev) => ({
                        ...prev,
                        [item.lead_id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  onClick={() => handleSaveBuild(item.lead_id)}
                  disabled={isSaving || !inputVal}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving & Generating Thumbnail...' : 'Save & Move to Send Queue'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
