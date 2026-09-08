import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  Server,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Save,
  Info,
} from 'lucide-react';
import { ModelSettings, WhatsAppStatus } from '../types';
import { api } from '../api/client';

export const SettingsView: React.FC = () => {
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Inputs
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [placesKeyInput, setPlacesKeyInput] = useState('');
  const [modelKeyInput, setModelKeyInput] = useState('');
  const [relayUrl, setRelayUrl] = useState('http://127.0.0.1:8787');

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [testPlacesLoading, setTestPlacesLoading] = useState(false);
  const [testModelLoading, setTestModelLoading] = useState(false);
  const [placesTestMsg, setPlacesTestMsg] = useState<string | null>(null);
  const [modelTestMsg, setModelTestMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [mRes, wRes] = await Promise.all([api.getModel(), api.getWhatsAppStatus()]);
    if (mRes.data) {
      setModelSettings(mRes.data);
      setProvider(mRes.data.provider || 'gemini');
      setModel(mRes.data.model || 'gemini-3.8-flash');
    }
    if (wRes.data) {
      setWhatsappStatus(wRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveModelSettings = async () => {
    setSaving(true);
    setSaveMsg(null);
    await api.saveModel({
      provider,
      model,
      places_key: placesKeyInput || undefined,
      model_key: modelKeyInput || undefined,
      whatsapp_relay_url: relayUrl,
    });
    setSaving(false);
    setPlacesKeyInput('');
    setModelKeyInput('');
    setSaveMsg('Settings & Encrypted Credentials Saved');
    setTimeout(() => setSaveMsg(null), 3000);
    loadData();
  };

  const handleTestKey = async (type: 'places' | 'model') => {
    if (type === 'places') {
      setTestPlacesLoading(true);
      setPlacesTestMsg(null);
      const res = await api.testKey('places', placesKeyInput);
      setTestPlacesLoading(false);
      setPlacesTestMsg(res.data?.message || res.error || 'Test failed');
    } else {
      setTestModelLoading(true);
      setModelTestMsg(null);
      const res = await api.testKey('model', modelKeyInput);
      setTestModelLoading(false);
      setModelTestMsg(res.data?.message || res.error || 'Test failed');
    }
  };

  if (loading) {
    return (
      <div id="settings-loading" className="p-8 text-center text-slate-500 animate-pulse">
        Loading configuration settings...
      </div>
    );
  }

  return (
    <div id="settings-view" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" /> Environment Settings &amp; Security
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure LLM providers, Google Places API credentials, and WhatsApp relay endpoint.
          </p>
        </div>

        <button
          id="save-settings-btn"
          onClick={handleSaveModelSettings}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-md shadow-xs transition"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveMsg}
        </div>
      )}

      {/* Security Assurance Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 shadow-xs text-xs space-y-2">
        <div className="flex items-center gap-2 text-teal-400 font-bold">
          <ShieldCheck className="w-4 h-4" /> Zero-Trust API Key Storage &amp; Encryption
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Your API keys are stored encrypted on the backend server environment and are <strong>never</strong> transmitted back to client-side browser requests or saved in plain text.
        </p>
      </div>

      {/* Model Provider Configuration */}
      <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-4 h-4 text-teal-600" /> 1. LLM Provider &amp; Model Selection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="ollama">Ollama (Local Node)</option>
              <option value="openrouter">OpenRouter Multi-Model</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Model Identifier
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-3.8-flash"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>

      {/* API Credentials */}
      <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-4 h-4 text-teal-600" /> 2. API Keys
        </h2>

        {/* Places Key */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              Google Places API Key
              {modelSettings?.places_key_set ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                  Set ✓
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded">
                  Not Set
                </span>
              )}
            </span>

            <a
              href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Where do I get this? <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              placeholder={modelSettings?.places_key_set ? 'Key stored securely' : 'AIzaSy...'}
              value={placesKeyInput}
              onChange={(e) => setPlacesKeyInput(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={() => handleTestKey('places')}
              disabled={testPlacesLoading}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
            >
              {testPlacesLoading ? 'Testing...' : 'Test Key'}
            </button>
          </div>

          {placesTestMsg && (
            <p className="text-[11px] font-mono text-teal-600 dark:text-teal-400">{placesTestMsg}</p>
          )}
        </div>

        {/* Model Key */}
        <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              Model API Key ({provider})
              {modelSettings?.key_set ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                  Set ✓
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded">
                  Not Set
                </span>
              )}
            </span>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Where do I get this? <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              placeholder={modelSettings?.key_set ? 'Key stored securely' : 'Enter model key...'}
              value={modelKeyInput}
              onChange={(e) => setModelKeyInput(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={() => handleTestKey('model')}
              disabled={testModelLoading}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
            >
              {testModelLoading ? 'Testing...' : 'Test Key'}
            </button>
          </div>

          {modelTestMsg && (
            <p className="text-[11px] font-mono text-teal-600 dark:text-teal-400">{modelTestMsg}</p>
          )}
        </div>
      </div>

      {/* WhatsApp Local Relay Settings */}
      <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-teal-600" /> 3. WhatsApp Local Relay Configuration
        </h2>

        <div className="text-xs space-y-2">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            Local Socket Relay Endpoint
          </label>
          <input
            type="text"
            value={relayUrl}
            onChange={(e) => setRelayUrl(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100"
          />
          <p className="text-[11px] text-slate-500">
            The local socket helper runs on your workstation. No session tokens leave your device.
          </p>
        </div>
      </div>

      {/* Transparent Data Privacy Notice */}
      <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-teal-600" /> Privacy &amp; Google Workspace Data Access
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          This application accesses Google Sheets exclusively through the user-granted Google Drive scope (<code>drive.file</code>) to create and sync your pipeline spreadsheet. No personal account data is shared with third parties or stored off-device.
        </p>
      </div>
    </div>
  );
};
