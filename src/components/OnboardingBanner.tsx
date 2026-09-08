import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Key,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  QrCode,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Summary, ModelSettings, WhatsAppStatus } from '../types';
import { api } from '../api/client';

interface OnboardingBannerProps {
  summary: Summary | null;
  modelSettings: ModelSettings | null;
  whatsappStatus: WhatsAppStatus | null;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
  summary,
  modelSettings,
  whatsappStatus,
  onRefresh,
  isOpen,
  onClose,
}) => {
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<string | null>(null);

  // Step 2 state
  const [provider, setProvider] = useState<string>(
    modelSettings?.provider || 'gemini'
  );
  const [modelName, setModelName] = useState<string>(
    modelSettings?.model || 'gemini-3.8-flash'
  );
  const [placesKeyInput, setPlacesKeyInput] = useState('');
  const [modelKeyInput, setModelKeyInput] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [testingPlaces, setTestingPlaces] = useState(false);
  const [testingModel, setTestingModel] = useState(false);
  const [placesTestResult, setPlacesTestResult] = useState<{
    valid: boolean;
    msg: string;
  } | null>(null);
  const [modelTestResult, setModelTestResult] = useState<{
    valid: boolean;
    msg: string;
  } | null>(null);

  // Step 3 state
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  if (!isOpen) return null;

  const sheetOk = !!summary?.sheet_url;
  const keysOk = !!modelSettings?.key_set;
  const relayOk = !!whatsappStatus?.connected;

  const handleCreateSheet = async () => {
    setCreatingSheet(true);
    setSheetMsg(null);
    const res = await api.createSheet();
    setCreatingSheet(false);
    if (res.data?.ok) {
      setSheetMsg(`Created "${res.data.title}" successfully!`);
      onRefresh();
    } else {
      setSheetMsg(res.error || 'Failed to create sheet');
    }
  };

  const handleSaveKeys = async () => {
    setSavingKeys(true);
    await api.saveModel({
      provider,
      model: modelName,
      places_key: placesKeyInput || undefined,
      model_key: modelKeyInput || undefined,
    });
    setSavingKeys(false);
    setPlacesKeyInput('');
    setModelKeyInput('');
    onRefresh();
  };

  const handleTestKey = async (type: 'places' | 'model') => {
    if (type === 'places') {
      setTestingPlaces(true);
      setPlacesTestResult(null);
      const res = await api.testKey('places', placesKeyInput);
      setTestingPlaces(false);
      if (res.data) {
        setPlacesTestResult({ valid: res.data.valid, msg: res.data.message });
      } else {
        setPlacesTestResult({ valid: false, msg: res.error || 'Test failed' });
      }
    } else {
      setTestingModel(true);
      setModelTestResult(null);
      const res = await api.testKey('model', modelKeyInput);
      setTestingModel(false);
      if (res.data) {
        setModelTestResult({ valid: res.data.valid, msg: res.data.message });
      } else {
        setModelTestResult({ valid: false, msg: res.error || 'Test failed' });
      }
    }
  };

  const handleFetchQr = async () => {
    setLoadingQr(true);
    const res = await api.getWhatsAppQr();
    setLoadingQr(false);
    if (res.data?.qr) {
      setQrCodeSvg(res.data.qr);
    }
  };

  return (
    <div
      id="onboarding-container"
      className="mb-6 p-5 rounded-xl border bg-slate-900 text-white shadow-md transition-all relative"
    >
      <button
        id="onboarding-close-btn"
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md"
        title="Dismiss onboarding banner"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4 pr-8">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>🚀 Welcome to Outreach Studio</span>
          <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
            3-Step Quick Start
          </span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Each step runs under your own Google account and local machine. Set
          these up once to enable automated SME website outreach.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STEP 1: SHEET */}
        <div
          id="onboarding-step-1"
          className={`p-4 rounded-lg border flex flex-col justify-between ${
            sheetOk
              ? 'bg-slate-800/80 border-emerald-500/40'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Step 1
              </span>
              {sheetOk ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Action Required
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" /> Google Drive
              Sheet
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Sign in with Google. The app creates a clean spreadsheet directly
              in your own Google Drive with the 5 pipeline tabs.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60">
            {sheetOk ? (
              <div className="space-y-2">
                <a
                  href={summary.sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition"
                >
                  Open Your Google Sheet <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleCreateSheet}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline w-full text-center block"
                >
                  Use or regenerate a different Sheet
                </button>
              </div>
            ) : (
              <div>
                <button
                  id="create-sheet-btn"
                  onClick={handleCreateSheet}
                  disabled={creatingSheet}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition disabled:opacity-50"
                >
                  {creatingSheet ? (
                    <>Creating Sheet in Drive...</>
                  ) : (
                    <>Sign in & Create Pipeline Sheet</>
                  )}
                </button>
              </div>
            )}
            {sheetMsg && (
              <p className="text-[11px] text-teal-300 mt-2">{sheetMsg}</p>
            )}
          </div>
        </div>

        {/* STEP 2: KEYS */}
        <div
          id="onboarding-step-2"
          className={`p-4 rounded-lg border flex flex-col justify-between ${
            keysOk
              ? 'bg-slate-800/80 border-emerald-500/40'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Step 2
              </span>
              {keysOk ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Set ✓
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Not Set
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Key className="w-4 h-4 text-teal-400" /> API Credentials
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Stored encrypted server-side &amp; never sent back to browser.
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Model Provider &amp; Model
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    id="provider-select"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="ollama">Ollama (Local)</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                  <input
                    id="model-name-input"
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                    placeholder="gemini-3.8-flash"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Google Places API Key</span>
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:underline flex items-center gap-0.5"
                  >
                    Where do I get this? <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-1">
                  <input
                    id="places-key-input"
                    type="password"
                    placeholder={
                      modelSettings?.places_key_set
                        ? 'Key saved (Set ✓)'
                        : 'AIzaSy...'
                    }
                    value={placesKeyInput}
                    onChange={(e) => setPlacesKeyInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => handleTestKey('places')}
                    disabled={testingPlaces}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium rounded"
                  >
                    {testingPlaces ? '...' : 'Test'}
                  </button>
                </div>
                {placesTestResult && (
                  <p
                    className={`text-[10px] mt-1 ${
                      placesTestResult.valid ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {placesTestResult.msg}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Model API Key ({provider})</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:underline flex items-center gap-0.5"
                  >
                    Where do I get this? <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-1">
                  <input
                    id="model-key-input"
                    type="password"
                    placeholder={
                      modelSettings?.key_set
                        ? 'Key saved (Set ✓)'
                        : 'Enter model key...'
                    }
                    value={modelKeyInput}
                    onChange={(e) => setModelKeyInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => handleTestKey('model')}
                    disabled={testingModel}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium rounded"
                  >
                    {testingModel ? '...' : 'Test'}
                  </button>
                </div>
                {modelTestResult && (
                  <p
                    className={`text-[10px] mt-1 ${
                      modelTestResult.valid ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {modelTestResult.msg}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <button
              id="save-keys-btn"
              onClick={handleSaveKeys}
              disabled={savingKeys}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded transition"
            >
              {savingKeys ? 'Saving Encrypted Keys...' : 'Save & Encrypt Keys'}
            </button>
          </div>
        </div>

        {/* STEP 3: WHATSAPP LOCAL RELAY */}
        <div
          id="onboarding-step-3"
          className={`p-4 rounded-lg border flex flex-col justify-between ${
            relayOk
              ? 'bg-slate-800/80 border-emerald-500/40'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Step 3
              </span>
              {relayOk ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  Local Relay
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Smartphone className="w-4 h-4 text-teal-400" /> WhatsApp Local Relay
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              WhatsApp sessions run on your own machine at{' '}
              <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-300">
                127.0.0.1:8787
              </code>
              . No session tokens leave your device.
            </p>

            {relayOk ? (
              <div className="mt-3 p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-xs">
                <p className="text-emerald-300 font-medium">
                  Connected: {whatsappStatus?.number || '+1 (504) 555-0199'}
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Local socket session active.
                </p>
              </div>
            ) : (
              <div className="mt-3 text-xs space-y-2">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-700 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1 text-amber-400 font-medium mb-0.5">
                    <Info className="w-3 h-3" /> Relay Not Detected
                  </div>
                  Download the local helper app, or click below to link QR code.
                </div>

                {qrCodeSvg ? (
                  <div className="p-2 bg-white rounded flex flex-col items-center justify-center">
                    <div
                      dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                      className="w-32 h-32"
                    />
                    <p className="text-[10px] text-slate-600 mt-1 font-medium">
                      Scan in WhatsApp &gt; Linked Devices
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleFetchQr}
                    disabled={loadingQr}
                    className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {loadingQr ? 'Generating QR...' : 'Show WhatsApp QR Code'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <a
              href="https://github.com/lyonchiam-king/Front-End-Design-Checklist"
              target="_blank"
              rel="noreferrer"
              className="text-teal-400 hover:underline text-[11px] inline-flex items-center gap-1"
            >
              Download Local Relay app <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
