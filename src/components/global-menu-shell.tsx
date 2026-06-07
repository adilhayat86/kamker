"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type GlobalMenuShellProps = {
  children: ReactNode;
};

export function GlobalMenuShell({ children }: GlobalMenuShellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleOutsidePress(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target;

      if (
        panelRef.current &&
        target &&
        "nodeType" in Object(target) &&
        !panelRef.current.contains(target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (typeof window !== "undefined" && "PointerEvent" in window) {
      document.addEventListener("pointerdown", handleOutsidePress);
    } else {
      document.addEventListener("mousedown", handleOutsidePress);
      document.addEventListener("touchstart", handleOutsidePress);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePress);
      document.removeEventListener("mousedown", handleOutsidePress);
      document.removeEventListener("touchstart", handleOutsidePress);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="fixed right-3 top-3 z-50" ref={panelRef}>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex size-10 items-center justify-center rounded-full border bg-white text-foreground shadow-lg transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? (
          <X className="size-4.5" aria-hidden="true" />
        ) : (
          <Menu className="size-4.5" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] rounded-lg border bg-white p-2.5 shadow-2xl"
          onClick={(event) => {
            const target = event.target;

            if (target && "closest" in Object(target) && (target as Element).closest("a")) {
              setOpen(false);
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
