"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";

type RowMenuProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function RowMenu({ title, subtitle, children }: RowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuRef}
      className={`
        ${isMobile
          ? "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          : "absolute right-0 top-full mt-1 z-50 min-w-56 bg-white border border-line rounded-xl shadow-lg origin-top-right"
        }
        transition-all duration-200 ease-out
        ${isAnimating
          ? "opacity-100 scale-100 translate-y-0"
          : isMobile
            ? "opacity-0 translate-y-full"
            : "opacity-0 scale-95"
        }
      `}
      role="menu"
      aria-label={title}
    >
      {isMobile && (
        <>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-line rounded-full" />
          </div>
          <div className="px-5 pb-3 border-b border-line">
            <div className="font-medium text-ink">{title}</div>
            {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
          </div>
        </>
      )}
      <div className={isMobile ? "py-2 pb-8" : "py-1"} onClick={handleClose}>
        {children}
      </div>
      {isMobile && (
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-12 bg-surface text-ink font-medium rounded-full hover:bg-line transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-ink transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More options"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="4" cy="10" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="16" cy="10" r="2" />
        </svg>
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div
              className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ${isAnimating ? "opacity-100" : "opacity-0"}`}
              onClick={handleClose}
            />
          )}
          {isMobile
            ? createPortal(menuContent, document.body)
            : menuContent}
        </>
      )}
    </div>
  );
}

type MenuItemProps = {
  onClick?: () => void;
  disabled?: boolean;
  hint?: string;
  active?: boolean;
  variant?: "default" | "danger";
  icon?: ReactNode;
  children: ReactNode;
};

export function RowMenuItem({
  onClick,
  disabled = false,
  hint,
  active = false,
  variant = "default",
  icon,
  children,
}: MenuItemProps) {
  const baseClasses = "w-full min-h-14 sm:min-h-10 px-5 sm:px-4 text-left text-base sm:text-sm flex items-center justify-between gap-2 transition-colors";
  const variantClasses =
    variant === "danger"
      ? "text-danger active:bg-red-50 sm:hover:bg-red-50"
      : "text-ink active:bg-surface sm:hover:bg-surface";
  const disabledClasses = disabled ? "opacity-40 cursor-not-allowed" : "";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
      role="menuitem"
    >
      <span className="flex items-center gap-3 sm:gap-2">
        {icon && <span className={variant === "danger" ? "text-danger/70" : "text-muted"}>{icon}</span>}
        {children}
        {active && (
          <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </button>
  );
}

export function RowMenuDivider() {
  return <div className="h-px bg-line my-1" />;
}

type StatusSegmentProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function RowMenuStatusSegment({ value, onChange, options }: StatusSegmentProps) {
  return (
    <div className="px-4 py-3 border-b border-line">
      <div className="flex bg-surface rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 min-h-9 text-sm font-medium rounded-md transition-colors ${
              value === option.value
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type AddMenuProps = {
  onAddJob: () => void;
  onAddSubfolder?: () => void;
  canAddSubfolder?: boolean;
};

export function AddMenu({ onAddJob, onAddSubfolder, canAddSubfolder = true }: AddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  const handleAddJob = () => {
    handleClose();
    onAddJob();
  };

  const handleAddSubfolder = () => {
    handleClose();
    onAddSubfolder?.();
  };

  const menuContent = (
    <div
      ref={menuRef}
      className={`
        ${isMobile
          ? "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          : "absolute right-0 top-full mt-1 z-50 min-w-40 bg-white border border-line rounded-xl shadow-lg origin-top-right"
        }
        transition-all duration-200 ease-out
        ${isAnimating
          ? "opacity-100 scale-100 translate-y-0"
          : isMobile
            ? "opacity-0 translate-y-full"
            : "opacity-0 scale-95"
        }
      `}
      role="menu"
      aria-label="Add options"
    >
      {isMobile && (
        <>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-line rounded-full" />
          </div>
          <div className="px-5 pb-3 border-b border-line">
            <div className="font-medium text-ink">Add</div>
          </div>
        </>
      )}
      <div className={isMobile ? "py-2 pb-8" : "py-1"}>
        <button
          type="button"
          onClick={handleAddJob}
          className="w-full min-h-11 sm:min-h-10 px-5 sm:px-4 text-left text-sm flex items-center gap-2 text-ink hover:bg-surface transition-colors"
          role="menuitem"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Add job
        </button>
        {canAddSubfolder && onAddSubfolder && (
          <button
            type="button"
            onClick={handleAddSubfolder}
            className="w-full min-h-11 sm:min-h-10 px-5 sm:px-4 text-left text-sm flex items-center gap-2 text-ink hover:bg-surface transition-colors"
            role="menuitem"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Add subfolder
          </button>
        )}
      </div>
      {isMobile && (
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-12 bg-surface text-ink font-medium rounded-full hover:bg-line transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="min-w-11 min-h-11 md:min-w-9 md:min-h-9 flex items-center justify-center text-muted hover:text-ink transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Add"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div
              className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ${isAnimating ? "opacity-100" : "opacity-0"}`}
              onClick={handleClose}
            />
          )}
          {isMobile
            ? createPortal(menuContent, document.body)
            : menuContent}
        </>
      )}
    </div>
  );
}
