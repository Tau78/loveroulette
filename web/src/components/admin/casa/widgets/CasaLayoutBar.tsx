"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createProfileFromCurrent,
  DEFAULT_PROFILE_ID,
  deleteProfile,
  renameProfile,
  resetDefaultToFactory,
  setActiveProfile,
  type CasaLayoutsState,
} from "@/lib/admin/casa-layouts";

type Props = {
  edit: boolean;
  onEditChange: (edit: boolean) => void;
  layouts: CasaLayoutsState;
  onLayoutsChange: (next: CasaLayoutsState) => void;
  onOpenGallery: () => void;
};

type MenuTarget = {
  id: string;
  isDefault: boolean;
  x: number;
  y: number;
};

const LONG_PRESS_MS = 500;

export function CasaLayoutBar({
  edit,
  onEditChange,
  layouts,
  onLayoutsChange,
  onOpenGallery,
}: Props) {
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const pressRef = useRef<{
    id: string;
    timer: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  function clearPress() {
    const press = pressRef.current;
    if (press) window.clearTimeout(press.timer);
    pressRef.current = null;
  }

  function beginPress(
    id: string,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) {
    clearPress();
    const startX = e.clientX;
    const startY = e.clientY;
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      setMenu({
        id,
        isDefault: id === DEFAULT_PROFILE_ID,
        x: startX,
        y: startY,
      });
    }, LONG_PRESS_MS);
    pressRef.current = { id, timer, startX, startY };
  }

  function onChipClick(id: string) {
    if (menu) {
      setMenu(null);
      return;
    }
    onLayoutsChange(setActiveProfile(layouts, id));
  }

  function promptName(title: string, initial = ""): string | null {
    const raw = window.prompt(title, initial);
    if (raw == null) return null;
    return raw.trim();
  }

  function createProfile() {
    const name = promptName("Nome del nuovo layout");
    if (!name) return;
    const result = createProfileFromCurrent(layouts, name);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    onLayoutsChange(result.state);
  }

  function doRename(id: string) {
    const profile = layouts.profiles.find((p) => p.id === id);
    if (!profile) return;
    const name = promptName("Rinomina layout", profile.name);
    if (!name) return;
    const result = renameProfile(layouts, id, name);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    onLayoutsChange(result.state);
    setMenu(null);
  }

  function doDelete(id: string) {
    if (!window.confirm("Eliminare questo layout?")) return;
    const result = deleteProfile(layouts, id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    onLayoutsChange(result.state);
    setMenu(null);
  }

  function doResetFactory() {
    if (!window.confirm("Ripristinare il layout Default di fabbrica?")) return;
    onLayoutsChange(resetDefaultToFactory(layouts));
    setMenu(null);
  }

  return (
    <div className="casa-layout-bar" data-casa-layout-bar="">
      <button
        type="button"
        className="casa-layout-edit"
        data-on={edit ? "1" : undefined}
        onClick={() => onEditChange(!edit)}
      >
        {edit ? "Fine" : "Edit"}
      </button>

      {layouts.profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          className="casa-layout-chip"
          data-on={layouts.activeId === p.id ? "1" : undefined}
          onClick={() => onChipClick(p.id)}
          onPointerDown={(e) => beginPress(p.id, e)}
          onPointerUp={clearPress}
          onPointerLeave={clearPress}
          onPointerCancel={clearPress}
          onPointerMove={(e) => {
            const press = pressRef.current;
            if (!press || press.id !== p.id) return;
            if (
              Math.abs(e.clientX - press.startX) > 8 ||
              Math.abs(e.clientY - press.startY) > 8
            ) {
              clearPress();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({
              id: p.id,
              isDefault: Boolean(p.isDefault) || p.id === DEFAULT_PROFILE_ID,
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          {p.name}
        </button>
      ))}

      {edit ? (
        <>
          <button
            type="button"
            className="casa-layout-add"
            aria-label="Aggiungi widget"
            onClick={onOpenGallery}
          >
            +
          </button>
          <button
            type="button"
            className="casa-layout-chip"
            onClick={createProfile}
          >
            Nuova
          </button>
        </>
      ) : null}

      {menu ? (
        <div
          className="casa-layout-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => doRename(menu.id)}
          >
            Rinomina
          </button>
          {menu.isDefault ? (
            <button type="button" role="menuitem" onClick={doResetFactory}>
              Ripristina fabbrica
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => doDelete(menu.id)}
            >
              Elimina
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
