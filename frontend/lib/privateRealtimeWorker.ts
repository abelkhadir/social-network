type WorkerMessage =
  | { type: "WORKER_EVENT"; eventType: string; payload: any }
  | { type: "SEND_TYPING"; data: any }
  | { type: "THREAD_READ_SYNC"; actorId: string }
  | { type: "LOGOUT_SYNC"; userID: string };

type WorkerListener = (message: WorkerMessage) => void;

let sharedWorkerInstance: SharedWorker | null = null;
let sharedPort: MessagePort | null = null;
let activeUserID = "";
let consumerCount = 0;
const listeners = new Set<WorkerListener>();

function ensureWorkerPort() {
  if (typeof window === "undefined" || !("SharedWorker" in window)) {
    return null;
  }

  if (!sharedWorkerInstance) {
    sharedWorkerInstance = new window.SharedWorker("/workers/realtime-shared-worker.js");
    sharedPort = sharedWorkerInstance.port;
    sharedPort.start?.();
    sharedPort.onmessage = (event: MessageEvent<WorkerMessage>) => {
      for (const listener of listeners) {
        listener(event.data);
      }
    };
  }

  return sharedPort;
}

export function acquirePrivateRealtimeWorker(userID: string) {
  const port = ensureWorkerPort();
  if (!port || !userID) return null;

  consumerCount += 1;
  if (activeUserID !== userID) {
    activeUserID = userID;
    port.postMessage({ type: "INIT", userID });
  }

  return port;
}

export function releasePrivateRealtimeWorker(userID: string) {
  if (!sharedPort || !userID) return;

  consumerCount = Math.max(0, consumerCount - 1);
  if (consumerCount === 0) {
    sharedPort.postMessage({ type: "DISCONNECT", userID });
    sharedPort.close();
    sharedPort = null;
    sharedWorkerInstance = null;
    activeUserID = "";
  }
}

export function subscribePrivateRealtimeWorker(listener: WorkerListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function postPrivateRealtimeWorker(message: Record<string, any>) {
  if (!sharedPort) return false;
  sharedPort.postMessage(message);
  return true;
}

export function hasPrivateRealtimeWorker() {
  return !!sharedPort;
}
