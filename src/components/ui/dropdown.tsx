"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

const MENU_WIDTH = 176; // 11rem
const MENU_MARGIN = 4;

/**
 * A portal-rendered dropdown. The menu is positioned with fixed coordinates
 * computed from the trigger, so it escapes any `overflow` clipping from parent
 * containers (e.g. scrollable tables) and flips upward when short on space.
 */
export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number; up: boolean }>({
    top: 0,
    left: 0,
    up: false,
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const position = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuH = menuRef.current?.offsetHeight ?? 220;
    const menuW = menuRef.current?.offsetWidth ?? MENU_WIDTH;
    const up = spaceBelow < menuH + 16 && rect.top > spaceBelow;
    const left = align === "right" ? rect.right - menuW : rect.left;
    setCoords({
      top: up ? rect.top - MENU_MARGIN : rect.bottom + MENU_MARGIN,
      left: Math.max(8, Math.min(left, window.innerWidth - menuW - 8)),
      up,
    });
  }, [align]);

  const toggle = () => {
    if (!open) position();
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    // re-measure after the menu renders (for flip calculation)
    position();
    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, position]);

  return (
    <>
      <div ref={triggerRef} onClick={toggle} className="inline-flex">
        {trigger}
      </div>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: MENU_WIDTH,
              transform: coords.up ? "translateY(-100%)" : undefined,
            }}
            className={cn(
              "z-[80] overflow-hidden rounded-md border border-border bg-surface py-1 shadow-dropdown animate-fade-in",
              className,
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export function DropdownItem({
  className,
  tone,
  icon,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "danger";
  icon?: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-content transition-colors hover:bg-surface-muted",
        tone === "danger" && "text-danger hover:bg-danger-soft",
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-content-subtle">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-border" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-content-subtle">
      {children}
    </div>
  );
}
