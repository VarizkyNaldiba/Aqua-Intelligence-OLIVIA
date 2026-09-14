/**
 * Firebase Realtime Database Utility for CatfishCare Web Dashboard
 */

export interface RealtimeTelemetry {
  kolam_id: number;
  suhu: number;
  ph: number;
  kekeruhan: number;
  tds: number;
  tinggi_air: number;
  sfr: number;
  risk_score: number;
  risk_status: string;
  wqs: number;
  exchange_target_percent: number;
  drain_pump: boolean;
  fill_pump: boolean;
  aerator: boolean;
  updated_at: string;
}

export interface RealtimeActuators {
  kolam_id: number;
  drain_pump: boolean;
  fill_pump: boolean;
  aerator: boolean;
  last_exchange?: string;
  updated_at: string;
}

/**
 * Subscribe to live telemetry changes via Server-Sent Events (SSE) EventSource.
 */
export function subscribeRealtimeTelemetry(
  kolamId: number = 1,
  onData: (data: RealtimeTelemetry) => void,
  rtdbUrl: string = 'https://explora-be1a0-default-rtdb.firebaseio.com'
): () => void {
  const nodeUrl = `${rtdbUrl.replace(/\/$/, '')}/telemetry/kolam_${kolamId}.json`;
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(nodeUrl);
    eventSource.addEventListener('put', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed && parsed.data) {
          onData(parsed.data);
        }
      } catch (err) {
        console.warn('[Firebase RTDB] SSE parse error:', err);
      }
    });

    eventSource.addEventListener('patch', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed && parsed.data) {
          onData(parsed.data);
        }
      } catch (err) {
        console.warn('[Firebase RTDB] SSE patch error:', err);
      }
    });
  } catch (e) {
    console.warn('[Firebase RTDB] EventSource initialization failed:', e);
  }

  // Return unsubscribe cleanup function
  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}
