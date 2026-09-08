import {
  Summary,
  CampaignSettings,
  ModelSettings,
  Lead,
  ReachabilityResponse,
  Brief,
  BuildItem,
  SendItem,
  RunLog,
  WhatsAppStatus,
  ApiResponse,
} from '../types';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        return { error: json.error || `HTTP ${res.status}: ${res.statusText}` };
      }
      return { data: json, ok: true };
    } catch (err: any) {
      return { error: err?.message || 'Network error occurred' };
    }
  }

  async getSummary(): Promise<ApiResponse<Summary>> {
    return this.request<Summary>('/api/summary');
  }

  async createSheet(): Promise<ApiResponse<{ ok: boolean; url: string; title: string }>> {
    return this.request<{ ok: boolean; url: string; title: string }>('/api/create-sheet', {
      method: 'POST',
    });
  }

  async getCampaign(): Promise<ApiResponse<CampaignSettings>> {
    return this.request<CampaignSettings>('/api/campaign');
  }

  async saveCampaign(settings: Partial<CampaignSettings>): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/campaign', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getModel(): Promise<ApiResponse<ModelSettings>> {
    return this.request<ModelSettings>('/api/model');
  }

  async saveModel(settings: {
    provider?: string;
    model?: string;
    places_key?: string;
    model_key?: string;
    whatsapp_relay_url?: string;
  }): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/model', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async testKey(type: 'places' | 'model', key?: string): Promise<ApiResponse<{ valid: boolean; message: string }>> {
    return this.request<{ valid: boolean; message: string }>('/api/test-key', {
      method: 'POST',
      body: JSON.stringify({ type, key }),
    });
  }

  async suggestAreas(location: string): Promise<ApiResponse<{ areas: string[] }>> {
    return this.request<{ areas: string[] }>('/api/suggest-areas', {
      method: 'POST',
      body: JSON.stringify({ location }),
    });
  }

  async getLeads(): Promise<ApiResponse<{ leads: Lead[] }>> {
    return this.request<{ leads: Lead[] }>('/api/leads');
  }

  async getNextUp(): Promise<ApiResponse<{ names: string[]; capped: boolean }>> {
    return this.request<{ names: string[]; capped: boolean }>('/api/next-up');
  }

  async getReachability(): Promise<ApiResponse<ReachabilityResponse>> {
    return this.request<ReachabilityResponse>('/api/reachability');
  }

  async checkWhatsAppBatch(): Promise<ApiResponse<{ checked: number; newly_verified: number }>> {
    return this.request<{ checked: number; newly_verified: number }>('/api/whatsapp/check-batch', {
      method: 'POST',
    });
  }

  async getReviewQueue(): Promise<ApiResponse<{ queue: Brief[] }>> {
    return this.request<{ queue: Brief[] }>('/api/review-queue');
  }

  async decideBrief(
    lead_id: string,
    decision: 'approve' | 'skip' | 'later'
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/decide', {
      method: 'POST',
      body: JSON.stringify({ lead_id, decision }),
    });
  }

  async regenerateBrief(lead_id: string): Promise<ApiResponse<{ prompt: string }>> {
    return this.request<{ prompt: string }>('/api/regenerate', {
      method: 'POST',
      body: JSON.stringify({ lead_id }),
    });
  }

  async rewriteOutreach(
    lead_id: string,
    instruction: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/api/outreach/rewrite', {
      method: 'POST',
      body: JSON.stringify({ lead_id, instruction }),
    });
  }

  async dropLead(lead_id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/drop', {
      method: 'POST',
      body: JSON.stringify({ lead_id }),
    });
  }

  async getBuildQueue(): Promise<ApiResponse<{ queue: BuildItem[] }>> {
    return this.request<{ queue: BuildItem[] }>('/api/build-queue');
  }

  async recordBuild(
    lead_id: string,
    preview_url: string
  ): Promise<ApiResponse<{ ok: boolean; screenshot_url: string }>> {
    return this.request<{ ok: boolean; screenshot_url: string }>('/api/record-build', {
      method: 'POST',
      body: JSON.stringify({ lead_id, preview_url }),
    });
  }

  async runBatch(what: string, limit?: number): Promise<ApiResponse<{ started: boolean }>> {
    return this.request<{ started: boolean }>('/api/run', {
      method: 'POST',
      body: JSON.stringify({ what, limit }),
    });
  }

  async getLog(): Promise<ApiResponse<RunLog>> {
    return this.request<RunLog>('/api/log');
  }

  async getWhatsAppStatus(): Promise<ApiResponse<WhatsAppStatus>> {
    return this.request<WhatsAppStatus>('/api/whatsapp/status');
  }

  async getWhatsAppQr(): Promise<ApiResponse<{ qr: string | null }>> {
    return this.request<{ qr: string | null }>('/api/whatsapp/qr');
  }

  async getSendQueue(): Promise<ApiResponse<{ queue: SendItem[]; excluded: { name: string; phone: string; reason: string }[] }>> {
    return this.request<{ queue: SendItem[]; excluded: { name: string; phone: string; reason: string }[] }>('/api/whatsapp/queue');
  }

  async sendWhatsApp(lead_id: string, customMessage?: string): Promise<
    ApiResponse<{ status: 'sent' | 'delivered' | 'unconfirmed' | 'failed'; detail?: string }>
  > {
    return this.request<{ status: 'sent' | 'delivered' | 'unconfirmed' | 'failed'; detail?: string }>(
      '/api/whatsapp/send',
      {
        method: 'POST',
        body: JSON.stringify({ lead_id, customMessage }),
      }
    );
  }

  async updateLeadNote(lead_id: string, note: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/lead-note', {
      method: 'POST',
      body: JSON.stringify({ lead_id, note }),
    });
  }

  async getDesignLevel(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/design-level');
  }

  async saveDesignLevel(settings: any): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/design-level', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getServices(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/services');
  }

  async saveServices(settings: any): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/services', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async undoWhatsAppSend(lead_id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/whatsapp/undo-send', {
      method: 'POST',
      body: JSON.stringify({ lead_id }),
    });
  }

  async skipWhatsApp(lead_id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/whatsapp/skip', {
      method: 'POST',
      body: JSON.stringify({ lead_id }),
    });
  }

  async resetWhatsApp(): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request<{ ok: boolean }>('/api/whatsapp/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
