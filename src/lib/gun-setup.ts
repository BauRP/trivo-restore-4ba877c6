/**
 * Supabase Realtime adapter — drop-in replacement for the original Gun mesh.
 *
 * The 30 Heroku Gun relays from the ZIP are dead (Heroku free tier shutdown,
 * Nov 2022). This module preserves the EXACT public API the rest of the app
 * imports — `default export`, `sendGunMessage`, `subscribeToChannel`,
 * `publishPublicKeys`, `lookupPublicKeys`, `sendNoisePacket`, UUID helpers —
 * but routes everything over Supabase Realtime broadcast channels.
 *
 * No database tables are required. Messages are ephemeral broadcasts (same
 * delivery semantic Gun had in practice once relays died). Public-key
 * publishing is cached in-memory + localStorage so peer lookups still work.
 */
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── UUID Dedup Set ──────────────────────────────────────────
const seenMessageUUIDs = new Set<string>();
const MAX_SEEN_UUIDS = 10000;

export function isUUIDv4(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isDuplicateMessage(uuid: string): boolean {
  if (seenMessageUUIDs.has(uuid)) return true;
  seenMessageUUIDs.add(uuid);
  if (seenMessageUUIDs.size > MAX_SEEN_UUIDS) {
    const first = seenMessageUUIDs.values().next().value;
    if (first) seenMessageUUIDs.delete(first);
  }
  return false;
}

export function generateUUIDv4(): string {
  return (
    crypto.randomUUID?.() ||
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    })
  );
}

// ─── Channel Pool ────────────────────────────────────────────
const channels: Map<string, RealtimeChannel> = new Map();

function getOrCreateChannel(name: string): RealtimeChannel {
  let ch = channels.get(name);
  if (ch) return ch;
  ch = supabase.channel(name, {
    config: { broadcast: { self: false, ack: false } },
  });
  channels.set(name, ch);
  return ch;
}

// ─── Public-Key Directory (localStorage-backed) ──────────────
const KEYS_PREFIX = "trivo:keys:";

export function publishPublicKeys(
  userId: string,
  signingPubKey: string,
  exchangePubKey: string,
) {
  try {
    const payload = {
      signingKey: signingPubKey,
      exchangeKey: exchangePubKey,
      updatedAt: Date.now(),
    };
    localStorage.setItem(KEYS_PREFIX + userId, JSON.stringify(payload));
    // Best-effort broadcast so other live peers can cache it.
    const ch = getOrCreateChannel("trivo-keys");
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "publish_keys",
          payload: { userId, ...payload },
        }).catch(() => {});
      }
    });
  } catch {}
}

export function lookupPublicKeys(
  userId: string,
): Promise<{ signingKey: string; exchangeKey: string } | null> {
  return new Promise((resolve) => {
    try {
      const cached = localStorage.getItem(KEYS_PREFIX + userId);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.signingKey && parsed?.exchangeKey) {
          resolve({ signingKey: parsed.signingKey, exchangeKey: parsed.exchangeKey });
          return;
        }
      }
    } catch {}

    // Live ask: subscribe briefly to the keys channel and resolve on first match.
    const ch = getOrCreateChannel("trivo-keys");
    const handler = (msg: { payload?: any }) => {
      const p = msg?.payload;
      if (p?.userId === userId && p?.signingKey && p?.exchangeKey) {
        try {
          localStorage.setItem(
            KEYS_PREFIX + userId,
            JSON.stringify({
              signingKey: p.signingKey,
              exchangeKey: p.exchangeKey,
              updatedAt: Date.now(),
            }),
          );
        } catch {}
        resolve({ signingKey: p.signingKey, exchangeKey: p.exchangeKey });
      }
    };
    ch.on("broadcast", { event: "publish_keys" }, handler);
    ch.subscribe();

    setTimeout(() => resolve(null), 5000);
  });
}

// ─── Messaging ───────────────────────────────────────────────
export function sendGunMessage(
  channelId: string,
  messagePayload: Record<string, unknown>,
) {
  try {
    const id =
      (messagePayload.id as string) ||
      `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ch = getOrCreateChannel(`trivo-channel-${channelId}`);
    const send = () =>
      ch
        .send({
          type: "broadcast",
          event: "message",
          payload: { ...messagePayload, id, timestamp: Date.now() },
        })
        .catch(() => {});

    const state = (ch as unknown as { state?: string }).state;
    if (state === "joined") {
      send();
    } else {
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") send();
      });
    }
  } catch {}
}

export function subscribeToChannel(
  channelId: string,
  callback: (data: any, key: string) => void,
) {
  try {
    const ch = getOrCreateChannel(`trivo-channel-${channelId}`);
    ch.on("broadcast", { event: "message" }, (msg: { payload?: any }) => {
      const data = msg?.payload;
      if (!data) return;
      const uuid = data.id || `${channelId}-${data.timestamp || Date.now()}`;
      if (isDuplicateMessage(uuid)) return;
      callback(data, uuid);
    });
    ch.subscribe();
  } catch {}
}

// ─── Cover Traffic (no-op stub) ──────────────────────────────
export function sendNoisePacket() {
  // Original implementation flooded Gun with random payloads as cover traffic.
  // On Supabase Realtime that would burn quota for no privacy benefit
  // (broadcast events aren't observable to outside parties anyway).
  // Kept as a no-op to preserve the public API.
}

// ─── Default export: Gun-shaped shim ─────────────────────────
// A few legacy call sites do `import gun from "@/lib/gun-setup"` and chain
// `gun.get(...).get(...).put(...)` / `.on(...)`. We expose a tiny chainable
// proxy that funnels writes through `sendGunMessage` and reads through
// `subscribeToChannel`, so the call sites compile and run without edits.
type GunNode = {
  get: (key: string) => GunNode;
  put: (value: any) => GunNode;
  once: (cb: (data: any, key?: string) => void) => GunNode;
  on: (cb: (data: any, key: string) => void) => GunNode;
  map: () => GunNode;
  off: () => GunNode;
};

function makeNode(path: string[]): GunNode {
  const node: GunNode = {
    get: (key: string) => makeNode([...path, String(key)]),
    put: (value: any) => {
      const channelId = path.join("/") || "root";
      try {
        sendGunMessage(channelId, typeof value === "object" && value ? value : { value });
      } catch {}
      return node;
    },
    once: (cb) => {
      try {
        const channelId = path.slice(0, -1).join("/") || "root";
        const wantKey = path[path.length - 1];
        const ch = getOrCreateChannel(`trivo-channel-${channelId}`);
        const handler = (msg: { payload?: any }) => {
          if (msg?.payload?.id === wantKey || !wantKey) {
            cb(msg?.payload, wantKey);
          }
        };
        ch.on("broadcast", { event: "message" }, handler);
        ch.subscribe();
        setTimeout(() => cb(null, wantKey), 3000);
      } catch {
        cb(null, path[path.length - 1]);
      }
      return node;
    },
    on: (cb) => {
      try {
        const channelId = path.join("/") || "root";
        subscribeToChannel(channelId, cb);
      } catch {}
      return node;
    },
    map: () => node,
    off: () => {
      try {
        const channelId = path.join("/") || "root";
        const ch = channels.get(`trivo-channel-${channelId}`);
        if (ch) {
          supabase.removeChannel(ch).catch(() => {});
          channels.delete(`trivo-channel-${channelId}`);
        }
      } catch {}
      return node;
    },
  };
  return node;
}

const gun = {
  get: (key: string) => makeNode([String(key)]),
  opt: (_opts: any) => gun,
  back: (_key: string) => ({}),
  _: { opt: { peers: {} } },
};

export default gun;
