import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatFolder {
  id: string;
  name: string;
  position: number;
  is_system: boolean;
}

const LS_KEY = "trivo-chat-folders-v1";
// Only the system "ВСЕ" tab is seeded by default. Users create their own custom groups.
const DEFAULTS: Omit<ChatFolder, "id">[] = [
  { name: "ВСЕ", position: 0, is_system: true },
];

const seedLocal = (): ChatFolder[] =>
  DEFAULTS.map((d, i) => ({ ...d, id: `local-${i}-${d.name}` }));

const readLocal = (): ChatFolder[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const seeded = seedLocal();
      localStorage.setItem(LS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as ChatFolder[];
  } catch {
    return seedLocal();
  }
};

const writeLocal = (folders: ChatFolder[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(folders));
  } catch {
    /* ignore */
  }
};

/**
 * Folder data store. If a Supabase session exists, syncs to chat_folders.
 * Otherwise falls back to localStorage so the UI works without auth.
 * Public API stays identical either way.
 */
export const useFolders = () => {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    setHasSession(!!session);

    if (!session) {
      const local = readLocal();
      setFolders(local);
      setActiveId((prev) => prev ?? local[0]?.id ?? null);
      setLoading(false);
      return;
    }

    // Ensure defaults exist for this user, then fetch
    try { await supabase.rpc("seed_default_folders"); } catch { /* ignore */ }
    const { data, error } = await supabase
      .from("chat_folders")
      .select("id, name, position, is_system")
      .order("position", { ascending: true });

    if (error || !data) {
      const local = readLocal();
      setFolders(local);
    } else {
      setFolders(data as ChatFolder[]);
    }
    setActiveId((prev) => prev ?? (data?.[0]?.id ?? null));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const addFolder = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const position = folders.length;
      if (hasSession) {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("chat_folders")
          .insert({ user_id: uid, name: trimmed.toUpperCase(), position, is_system: false })
          .select("id, name, position, is_system")
          .single();
        if (!error && data) setFolders((p) => [...p, data as ChatFolder]);
      } else {
        const next: ChatFolder = {
          id: `local-${Date.now()}`,
          name: trimmed.toUpperCase(),
          position,
          is_system: false,
        };
        const updated = [...folders, next];
        setFolders(updated);
        writeLocal(updated);
      }
    },
    [folders, hasSession],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim().toUpperCase();
      if (!trimmed) return;
      setFolders((p) => p.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
      if (hasSession) {
        await supabase.from("chat_folders").update({ name: trimmed }).eq("id", id);
      } else {
        const updated = folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
        writeLocal(updated);
      }
    },
    [folders, hasSession],
  );

  const removeFolder = useCallback(
    async (id: string) => {
      const target = folders.find((f) => f.id === id);
      if (!target || target.is_system) return;
      setFolders((p) => p.filter((f) => f.id !== id));
      if (activeId === id) setActiveId(folders[0]?.id ?? null);
      if (hasSession) {
        await supabase.from("chat_folders").delete().eq("id", id);
      } else {
        const updated = folders.filter((f) => f.id !== id);
        writeLocal(updated);
      }
    },
    [folders, hasSession, activeId],
  );

  return {
    folders,
    activeId,
    setActiveId,
    loading,
    hasSession,
    addFolder,
    renameFolder,
    removeFolder,
    reload: load,
  };
};
