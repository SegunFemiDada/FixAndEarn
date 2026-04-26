//path: apps/web/src/lib/chat/realtime.ts
import apiClient from "@/lib/apiClient";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("fa_jwt");
}

export function openChatStream(args: {
  jobId: string;
  fixerId: string;
  onEvent: (type: string, data: any) => void;
  onError?: (err: any) => void;
}) {
  const token = getToken();
  if (!token) throw new Error("Missing JWT");

  const baseURL = apiClient.defaults.baseURL!;
  const url = `${baseURL}/jobs/${args.jobId}/chats/${args.fixerId}/stream`;

  const ctrl = new AbortController();

  (async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames separated by \n\n
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          let eventType = "message";
          let dataStr = "";

          for (const line of chunk.split("\n")) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataStr += line.slice(5).trim();
          }

          let parsed: any = dataStr;
          try {
            parsed = dataStr ? JSON.parse(dataStr) : null;
          } catch {}

          args.onEvent(eventType, parsed);
        }
      }
    } catch (e) {
      if ((e as any)?.name === "AbortError") return;
      args.onError?.(e);
    }
  })();

  return () => ctrl.abort();
}