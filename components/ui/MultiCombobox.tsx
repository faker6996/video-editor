"use client";

import * as React from "react";
import { createPortal } from "react-dom";
// Removed floating-ui dependencies
import { cn } from "@/lib/utils/cn";
import { ChevronDown, Search, Check } from "lucide-react";
import { useShadCNAnimations } from "@/lib/utils/shadcn-animations";

interface MultiComboboxProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
  disabledOptions?: string[];
  showTags?: boolean;
  showClear?: boolean;
  className?: string;
  disabled?: boolean;
}

export const MultiCombobox: React.FC<MultiComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  maxSelected,
  disabledOptions = [],
  showTags = true,
  showClear = true,
  className,
  disabled = false,
}) => {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<Array<HTMLElement | null>>([]);

  // Manual positioning
  const [dropdownPosition, setDropdownPosition] = React.useState<{top: number, left: number, width: number} | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Inject ShadCN animations
  useShadCNAnimations();

  // Calculate positioning synchronously on open to avoid flicker
  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    return {
      top: rect.bottom + scrollTop + 4,
      left: rect.left + scrollLeft,
      width: rect.width,
    };
  }, []);

  // Reposition on resize/scroll while open
  React.useEffect(() => {
    if (!open) return;
    const handler = () => {
      const pos = calculatePosition();
      if (pos) setDropdownPosition(pos);
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, calculatePosition]);

  // Handle clicks outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const dropdown = document.querySelector('[data-dropdown="multicombobox"]') as Element;
        if (dropdown && !dropdown.contains(target)) {
          setOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  const toggleSelect = (val: string) => {
    if (disabledOptions.includes(val)) return;
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      if (!maxSelected || value.length < maxSelected) {
        onChange([...value, val]);
      }
    }
  };

  const handleRemove = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) setOpen(true);

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex !== null && filtered[activeIndex]) {
        toggleSelect(filtered[activeIndex]);
      }
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Auto-focus input when dropdown opens
  React.useEffect(() => {
    if (open) {
      // Focus input after dropdown is positioned
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <div className={cn("relative w-[250px]", className)}>
      <div className="flex flex-wrap gap-1 mb-1">
        {showTags &&
          value.map((item) => (
            <span key={item} className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-accent-foreground">
              {item}
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(item);
                }} 
                className="text-xs hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        {showClear && value.length > 0 && (
          <button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClearAll();
            }} 
            className="ml-auto text-xs text-muted-foreground hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          const next = !open;
          if (next) {
            const pos = calculatePosition();
            if (pos) setDropdownPosition(pos);
          }
          setOpen(next);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
          "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className="truncate">{value.length ? `${value.length} selected` : "Select..."}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>

      {open && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          data-dropdown="multicombobox"
          style={{
            position: 'absolute',
            top: dropdownPosition?.top || 0,
            left: dropdownPosition?.left || 0,
            width: dropdownPosition?.width || 200,
            zIndex: 9999,
          }}
          data-state={open ? 'open' : 'closed'}
          className={cn(
            "z-[9999]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <div
            className={cn(
              "rounded-md border bg-popover text-popover-foreground shadow-md",
              "backdrop-blur-sm bg-popover/95 border-border/60"
            )}
          >
          <div className="relative border-b border-border/60">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full rounded-t-md bg-transparent px-8 py-2 text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto text-sm p-1">
            {filtered.length ? (
              filtered.map((item, index) => {
                const isSelected = value.includes(item);
                const isDisabled = disabledOptions.includes(item);

                return (
                  <li
                    key={item}
                    ref={(node) => {
                      listRef.current[index] = node;
                    }}
                    onClick={() => {
                      toggleSelect(item);
                      inputRef.current?.focus();
                    }}
                    style={{
                      animationDelay: open ? `${index * 25}ms` : '0ms',
                    }}
                    className={cn(
                      "dropdown-item flex cursor-pointer items-center justify-between px-3 py-2 rounded-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      index === activeIndex && "bg-accent text-accent-foreground",
                      isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    {item}
                    {isSelected && <Check className="h-4 w-4" />}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-muted-foreground">No result.</li>
            )}
          </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
