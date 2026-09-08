import React, { useState, useEffect } from 'react';
import {
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Edit3,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { SendItem, SendStatus, WhatsAppStatus } from '../types';
import { api } from '../api/client';

interface SendQueueViewProps {
  whatsappStatus: WhatsAppStatus | null;
  onRefresh: () => void;
}

export const SendQueueView: React.FC<SendQueueViewProps> = ({
  whatsappStatus,
  onRefresh,
}) => {
  const [queue, setQueue] = useState<SendItem[]>([]);
  const [excluded, setExcluded] = useState<{ name: string; phone: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesMap, setMessagesMap] = useState<Record<string, string>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sendingAll, setSendingAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // AI Rewrite drawer/inline state
  const [rewriteLeadId, setRewriteLeadId] = useState<string | null>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [rewriting, setRewriting] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    const res = await api.getSendQueue();
    if (res.data) {
      setQueue(res.data.queue);
      setExcluded(res.data.excluded);
      const initialMsgs: Record<string, string> = {};
      res.data.queue.forEach((item) => {
        initialMsgs[item.lead_id] = item.whatsapp_message;
      });
      setMessagesMap(initialMsgs);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSendSingle = async (lead_id: string) => {
    const msg = messagesMap[lead_id];
    setSendingMap((prev) => ({ ...prev, [lead_id]: true }));
    await api.sendWhatsApp(lead_id, msg);
    setSendingMap((prev) => ({ ...prev, [lead_id]: false }));
    loadQueue();
    onRefresh();
  };

  const handleSendAll = async () => {
    setShowConfirmModal(false);
    setSendingAll(true);
    for (const item of queue) {
      if (!item.status) {
        await api.sendWhatsApp(item.lead_id, messagesMap[item.lead_id]);
      }
    }
    setSendingAll(false);
    loadQueue();
    onRefresh();
  };

  const handleRewrite = async (lead_id: string) => {
    if (!rewriteInstruction) return;
    setRewriting(true);
    const res = await api.rewriteOutreach(lead_id, rewriteInstruction);
    setRewriting(false);
    if (res.data?.message) {
      setMessagesMap((prev) => ({ ...prev, [lead_id]: res.data!.message }));
      setRewriteLeadId(null);
      setRewriteInstruction('');
    }
  };

  if (loading) {
    return (
      <div id="send-loading" className="p-8 text-center text-slate-500 animate-pulse">
        Loading outreach send queue...
      </div>
    );
  }

  const pendingQueue = queue.filter((item) => !item.status || item.status === 'failed');

  return (
    <div id="send-queue-view" className="space-y-6">
      {/* Top Header & Send All Control */}
      <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" /> WhatsApp Send Queue ({queue.length} Built Sites)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review custom WhatsApp messages, edit inline, and transmit via Local Relay socket.
          </p>
        </div>

        <button
          id="send-all-btn"
          onClick={() => setShowConfirmModal(true)}
          disabled={sendingAll || pendingQueue.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sendingAll ? 'Transmitting Batch...' : `Send All (${pendingQueue.length} Pending)`}
        </button>
      </div>

      {/* Relay Disconnected Warning Banner if missing */}
      {!whatsappStatus?.connected && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Local Relay Read-Only Mode:</strong> WhatsApp socket is not connected on{' '}
              <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">127.0.0.1:8787</code>.
              Messages will be copied to clipboard upon clicking Send.
            </span>
          </div>
        </div>
      )}

      {/* Main Queue Cards */}
      <div className="space-y-4">
        {queue.map((item) => {
          const isSending = sendingMap[item.lead_id] || false;
          const currentMsg = messagesMap[item.lead_id] || item.whatsapp_message;

          return (
            <div
              key={item.lead_id}
              id={`send-card-${item.lead_id}`}
              className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Column 1: Site Thumbnail Preview (4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{item.business_name}</span>
                  <a
                    href={item.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    View Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-2xs">
                  <img
                    src={item.screenshot_url || `/api/screenshot/${encodeURIComponent(item.lead_id)}`}
                    alt={`Preview of ${item.business_name}`}
                    className="w-full h-44 object-cover"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-500">
                  Recipient Dial: <strong className="text-teal-600 dark:text-teal-400">{item.e164_phone}</strong>
                </div>
              </div>

              {/* Column 2: Message & Send Control (8 cols) */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" /> Inline Editable WhatsApp Pitch Message
                    </label>

                    <button
                      onClick={() =>
                        setRewriteLeadId(rewriteLeadId === item.lead_id ? null : item.lead_id)
                      }
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> AI Rewrite Instruction
                    </button>
                  </div>

                  {/* AI Rewrite Panel */}
                  {rewriteLeadId === item.lead_id && (
                    <div className="mb-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs space-y-2">
                      <input
                        type="text"
                        placeholder="e.g., 'Make it shorter and mention 50% discount this month'..."
                        value={rewriteInstruction}
                        onChange={(e) => setRewriteInstruction(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded text-xs text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRewriteLeadId(null)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRewrite(item.lead_id)}
                          disabled={rewriting || !rewriteInstruction}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[11px] font-semibold"
                        >
                          {rewriting ? 'Rewriting...' : 'Apply AI Rewrite'}
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={4}
                    value={currentMsg}
                    onChange={(e) =>
                      setMessagesMap((prev) => ({
                        ...prev,
                        [item.lead_id]: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-sans leading-relaxed"
                  />
                </div>

                {/* Bottom Status & Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  {/* Status Badges */}
                  <div>
                    {item.status === 'delivered' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                      </span>
                    )}
                    {item.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                      </span>
                    )}
                    {item.status === 'read' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    )}
                    {/* CRITICAL: Unconfirmed status styled NEUTRALLY, not as error! */}
                    {item.status === 'unconfirmed' && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full"
                        title="Accepted by WhatsApp socket; delivery receipt pending."
                      >
                        <Clock className="w-3.5 h-3.5" /> Unconfirmed (Pending Receipt)
                      </span>
                    )}
                    {!item.status && (
                      <span className="text-xs text-slate-400 font-medium">Ready to Send</span>
                    )}
                  </div>

                  <button
                    id={`send-single-btn-${item.lead_id}`}
                    onClick={() => handleSendSingle(item.lead_id)}
                    disabled={isSending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'Sending...' : 'Send WhatsApp Message'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Send All */}
      {showConfirmModal && (
        <div id="send-all-confirm-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" /> Confirm Batch WhatsApp Outreach
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You are about to transmit <strong>{pendingQueue.length} custom WhatsApp messages</strong> with site preview links via your local relay app socket.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300">
              Target Count: {pendingQueue.length} leads
              <br />
              Estimated Spend: $0.00
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                id="confirm-batch-send-btn"
                onClick={handleSendAll}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-xs"
              >
                Confirm &amp; Send Batch Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
