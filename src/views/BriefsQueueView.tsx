import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Check,
  X,
  Clock,
  RotateCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { Brief } from '../types';
import { api } from '../api/client';

export const BriefsQueueView: React.FC = () => {
  const [queue, setQueue] = useState<Brief[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    const res = await api.getReviewQueue();
    if (res.data?.queue) {
      setQueue(res.data.queue);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const currentBrief = queue[currentIndex] || null;

  const handleDecision = async (decision: 'approve' | 'skip' | 'later') => {
    if (!currentBrief) return;
    const lead_id = currentBrief.lead_id;

    if (decision === 'later') {
      setCurrentIndex((prev) => (prev + 1) % queue.length);
      return;
    }

    await api.decideBrief(lead_id, decision);
    setActionSuccess(
      decision === 'approve'
        ? `Approved "${currentBrief.business_name}" (spends $0.00)`
        : `Skipped "${currentBrief.business_name}"`
    );

    setTimeout(() => setActionSuccess(null), 3000);

    // Remove from local queue
    const updated = queue.filter((_, idx) => idx !== currentIndex);
    setQueue(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleRegenerate = async () => {
    if (!currentBrief) return;
    setRegenerating(true);
    const res = await api.regenerateBrief(currentBrief.lead_id);
    setRegenerating(false);
    if (res.data?.prompt) {
      const updatedQueue = [...queue];
      updatedQueue[currentIndex].lovable_prompt = res.data.prompt;
      setQueue(updatedQueue);
    }
  };

  const handleCopyPrompt = () => {
    if (!currentBrief) return;
    navigator.clipboard.writeText(currentBrief.lovable_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard Navigation Listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') handleDecision('approve');
      if (e.key === 's' || e.key === 'S') handleDecision('skip');
      if (e.key === 'l' || e.key === 'L') handleDecision('later');
      if (e.key === 'r' || e.key === 'R') handleRegenerate();
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % queue.length);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + queue.length) % queue.length);
      }
    },
    [currentBrief, queue]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div id="briefs-loading" className="p-8 text-center text-slate-500 animate-pulse">
        Loading site briefs queue...
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div id="briefs-empty-card" className="p-12 text-center rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Review Queue All Clear!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          No pending site briefs waiting for review. Run the lead research &amp; site brief pipeline to discover more leads.
        </p>
      </div>
    );
  }

  return (
    <div id="briefs-queue-view" className="space-y-4 max-w-4xl mx-auto">
      {/* Top Queue Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Item {currentIndex + 1} of {queue.length}
          </span>
          {/* Explicit Cost Assurance Badge */}
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" /> Approving Spends $0.00
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + queue.length) % queue.length)
            }
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Previous brief (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % queue.length)}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Next brief (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {actionSuccess}
        </div>
      )}

      {/* Main Single-Focus Review Card */}
      {currentBrief && (
        <div id={`brief-card-${currentBrief.lead_id}`} className="p-6 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                {currentBrief.research_summary?.category || 'SME Business'}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentBrief.business_name}
              </h1>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Rewriting Prompt...' : 'Regenerate Brief (R)'}
            </button>
          </div>

          {/* Research Context Summary */}
          {currentBrief.research_summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                  Recommended Site Angle
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {currentBrief.research_summary.angle}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                  Top Customer Praise Signal
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 italic">
                  "{currentBrief.research_summary.praise}"
                </p>
              </div>
            </div>
          )}

          {/* Lovable Generator Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-teal-600" /> Generated Site Prompt (Lovable / Builder Code)
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
              </button>
            </div>

            <textarea
              readOnly
              value={currentBrief.lovable_prompt}
              rows={8}
              className="w-full p-3.5 bg-slate-900 text-teal-200 font-mono text-xs rounded-lg border border-slate-800 leading-relaxed"
            />
          </div>

          {/* Action Decision Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="brief-approve-btn"
                onClick={() => handleDecision('approve')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Approve (A)
              </button>

              <button
                id="brief-skip-btn"
                onClick={() => handleDecision('skip')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Skip (S)
              </button>
            </div>

            <button
              id="brief-later-btn"
              onClick={() => handleDecision('later')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <Clock className="w-4 h-4" />
              Decide Later (L)
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <Keyboard className="w-3.5 h-3.5" /> Keyboard Controls:
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono font-bold text-slate-800 dark:text-slate-200">A</kbd> Approve
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono font-bold text-slate-800 dark:text-slate-200">S</kbd> Skip
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono font-bold text-slate-800 dark:text-slate-200">L</kbd> Later
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono font-bold text-slate-800 dark:text-slate-200">R</kbd> Regenerate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono font-bold text-slate-800 dark:text-slate-200">← →</kbd> Prev/Next
        </span>
      </div>
    </div>
  );
};
