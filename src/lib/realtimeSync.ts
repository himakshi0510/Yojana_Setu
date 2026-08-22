/**
 * Realtime Global Sync Engine & Event Hub for Yojana Setu (योजना सेतु)
 * Broadcasts status updates, application tracking state, and document readiness live across tabs.
 */

export interface RealtimeState {
  activeApplicationsCount: number;
  completedDocsPercentage: number;
  unlockedAnnualValue: number;
  userLocation: {
    state: string;
    district: string;
    pincode: string;
  };
  lastUpdatedTimestamp: number;
}

const DEFAULT_REALTIME_STATE: RealtimeState = {
  activeApplicationsCount: 2,
  completedDocsPercentage: 75,
  unlockedAnnualValue: 751000,
  userLocation: {
    state: "Uttar Pradesh",
    district: "Varanasi",
    pincode: "221001",
  },
  lastUpdatedTimestamp: Date.now(),
};

const BROADCAST_CHANNEL_NAME = "yojanasetu_realtime_sync";

// Helper to safely get BroadcastChannel
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (err) {
      console.warn("BroadcastChannel not supported or blocked:", err);
    }
  }
  return null;
}

// Get current state from localStorage or default
export function getRealtimeState(): RealtimeState {
  if (typeof window === "undefined") return DEFAULT_REALTIME_STATE;
  try {
    const saved = localStorage.getItem("yojanasetu_realtime_state");
    if (saved) {
      return { ...DEFAULT_REALTIME_STATE, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn("Error reading realtime state:", err);
  }
  return DEFAULT_REALTIME_STATE;
}

// Update realtime state and broadcast live event to all components & open browser windows
export function updateRealtimeState(partial: Partial<RealtimeState>) {
  if (typeof window === "undefined") return;

  const current = getRealtimeState();
  const newState: RealtimeState = {
    ...current,
    ...partial,
    lastUpdatedTimestamp: Date.now(),
  };

  try {
    localStorage.setItem("yojanasetu_realtime_state", JSON.stringify(newState));
  } catch (err) {
    console.warn("Error saving realtime state:", err);
  }

  // 1. Dispatch local DOM custom event for instant UI update
  window.dispatchEvent(
    new CustomEvent("yojanasetu_realtime_update", { detail: newState })
  );

  // 2. Broadcast to other open browser tabs
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage(newState);
    channel.close();
  }
}

// Subscribe to realtime changes in any component
export function subscribeRealtimeState(
  callback: (state: RealtimeState) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<RealtimeState>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("yojanasetu_realtime_update", handleCustomEvent);

  const channel = getBroadcastChannel();
  if (channel) {
    channel.onmessage = (event: MessageEvent<RealtimeState>) => {
      if (event.data) {
        callback(event.data);
      }
    };
  }

  return () => {
    window.removeEventListener("yojanasetu_realtime_update", handleCustomEvent);
    if (channel) {
      channel.close();
    }
  };
}
