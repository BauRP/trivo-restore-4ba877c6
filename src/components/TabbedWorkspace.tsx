import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useFolders, type ChatFolder } from "@/hooks/useFolders";

const SWIPE_THRESHOLD = 60; // px

interface Props {
  /** Optional callback so the chat list can filter by active folder. */
  onActiveFolderChange?: (folder: ChatFolder | null) => void;
}

const TabbedWorkspace = ({ onActiveFolderChange }: Props) => {
  const { folders, activeId, setActiveId, addFolder, removeFolder, loading } = useFolders();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const dragStartX = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeIndex = Math.max(
    0,
    folders.findIndex((f) => f.id === activeId),
  );

  const setActive = (id: string) => {
    setActiveId(id);
    const f = folders.find((x) => x.id === id) ?? null;
    onActiveFolderChange?.(f);
  };

  // Horizontal swipe to switch folders.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    const next = dx < 0 ? activeIndex + 1 : activeIndex - 1;
    if (next >= 0 && next < folders.length) setActive(folders[next].id);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      setEditing(false);
      return;
    }
    await addFolder(newName);
    setNewName("");
    setEditing(false);
  };

  if (loading) {
    return <div className="h-11 border-b border-border/40" aria-hidden="true" />;
  }

  return (
    <div
      className="relative w-full border-b border-border/40 bg-background/80 backdrop-blur-md select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      role="tablist"
      aria-label="Chat folders"
    >
      <div ref={listRef} className="flex items-center overflow-x-auto scrollbar-hide">
        {folders.map((f) => {
          const active = f.id === activeId;
          return (
            <div
              key={f.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                // Spec §1 — ВСЕ (system) and every other tab must ALWAYS be
                // interactive. Never short-circuit on `active` — always re-fire
                // the state update so the indicator and filters re-sync.
                setActive(f.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(f.id);
                }
              }}
              className={`relative shrink-0 px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer select-none ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {f.name}
                {!f.is_system && active && (
                  <span
                    role="button"
                    aria-label={`Delete folder ${f.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFolder(f.id);
                    }}
                    className="opacity-60 hover:opacity-100 cursor-pointer inline-flex"
                  >
                    <X size={12} />
                  </span>
                )}
              </span>
              {active && (
                <motion.span
                  layoutId="folder-underline"
                  className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary"
                  style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.8)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </div>
          );
        })}

        {editing ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setNewName("");
                setEditing(false);
              }
            }}
            placeholder="ИМЯ"
            maxLength={16}
            className="mx-2 h-7 w-24 rounded-md border border-primary/40 bg-background px-2 text-xs font-bold uppercase text-foreground outline-none focus:border-primary"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 px-3 py-2.5 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Add folder"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TabbedWorkspace;
