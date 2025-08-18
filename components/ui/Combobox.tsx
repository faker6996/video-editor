"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { useShadCNAnimations } from "@/lib/utils/shadcn-animations";

// --- PROPS ---
interface ComboboxProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  allowClear?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  usePortal?: boolean;
}


// --- MAIN COMPONENT ---
export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  disabled = false,
  allowClear = false,
  usePortal = true,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Inject ShadCN animations
  React.useLayoutEffect(() => {
    useShadCNAnimations();
  }, []);

  const listRef = React.useRef<(HTMLLIElement | null)[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on query
  const filteredOptions = React.useMemo(() => options.filter((o) => o.toLowerCase().includes(query.toLowerCase())), [options, query]);

  // Manual positioning
  const [dropdownPosition, setDropdownPosition] = React.useState<{top: number, left: number, width: number} | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

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
        const dropdown = document.querySelector('[data-combobox-dropdown]') as Element;
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

  // Event Handlers
  const handleSelect = (val: string) => {
    if (val !== undefined && val !== null) {
      onChange(val);
      setOpen(false);
      triggerRef.current?.focus(); // Return focus to the trigger
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  // Reset state when dropdown closes và focus input khi mở
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(null);
    } else {
      // Focus vào input search khi dropdown mở
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);


  const dropdownContent = (
    <div
      data-combobox-dropdown
      style={{
        position: 'absolute',
        top: dropdownPosition?.top || 0,
        left: dropdownPosition?.left || 0,
        width: dropdownPosition?.width || 200,
        zIndex: 9999,
      }}
      data-state={open ? 'open' : 'closed'}
      role="listbox"
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
        {/* Search Input */}
        <div className="relative p-3 border-b border-border/50 bg-muted/20">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(null); // Reset active index on search
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => {
                  const next = (prev === null ? 0 : prev + 1);
                  return next >= filteredOptions.length ? 0 : next;
                });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => {
                  const next = (prev === null ? filteredOptions.length - 1 : prev - 1);
                  return next < 0 ? filteredOptions.length - 1 : next;
                });
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex !== null && filteredOptions[activeIndex]) {
                  handleSelect(filteredOptions[activeIndex]);
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-md bg-background/50 py-2 pl-8 pr-3 text-sm border-0 focus:outline-none focus:bg-background/80 transition-colors placeholder:text-muted-foreground/60"
            aria-autocomplete="list"
            // Accessibility: Connects input to the active descendant for screen readers
            aria-activedescendant={activeIndex != null ? `combobox-item-${filteredOptions[activeIndex]}` : undefined}
          />
        </div>

        {/* Options List */}
        <div className="max-h-64 overflow-y-auto overscroll-contain">
          <ul className="p-1 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, index) => (
                <li
                  key={item}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  // Accessibility: Add required role and aria attributes
                  id={`combobox-item-${item}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={item === value}
                  onClick={() => handleSelect(item)}
                  style={{
                    animationDelay: open ? `${index * 25}ms` : '0ms',
                  }}
                  className={cn(
                    "dropdown-item group flex cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-sm",
                    "outline-none focus:outline-none focus-visible:outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    index === activeIndex && "bg-accent text-accent-foreground",
                    item === value && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="truncate">{item}</span>
                  {item === value && <Check className="h-4 w-4 text-primary" />}
                </li>
              ))
            ) : (
              <li className="px-3 py-8 text-center text-muted-foreground text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 opacity-50" />
                  <span>{emptyText}</span>
                </div>
              </li>
            )}
          </ul>
        </div>
        </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          const next = !open;
          if (next) {
            const pos = calculatePosition();
            if (pos) setDropdownPosition(pos);
          }
          setOpen(next);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>

        <div className="flex items-center gap-1 ml-2">
          {allowClear && value && !disabled && (
            // FIX: Use a div instead of a nested button
            <div
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={handleClear}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClear(e as any)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </div>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown Portal or Inline */}
      {usePortal
        ? open && dropdownPosition && typeof window !== 'undefined' && createPortal(dropdownContent, document.body)
        : open && dropdownPosition && dropdownContent}
    </>
  );
};
