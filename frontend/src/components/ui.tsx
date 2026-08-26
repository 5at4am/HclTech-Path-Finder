import React from "react";
import { Loader2 } from "lucide-react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------- Button --------------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  icon?: boolean;
  loading?: boolean;
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon = false, loading, className, children, disabled, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "accent" && "btn-accent",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        icon && "btn-icon",
        className,
      )}
      {...p}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

/* ---------------------------------- Input ---------------------------------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  valid?: boolean;
};
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, valid, className, ...p }, ref) => (
    <input
      ref={ref}
      className={cx("input", invalid && "input-error", valid && "input-success", className)}
      {...p}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; valid?: boolean }
>(({ invalid, valid, className, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cx("textarea", invalid && "textarea-error", valid && "textarea-success", className)}
    {...p}
  />
));
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid, className, children, ...p }, ref) => (
    <select ref={ref} className={cx("select", invalid && "select-error", className)} {...p}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

/* ---------------------------------- Badge ---------------------------------- */
type BadgeTone = "brand" | "accent" | "success" | "warning" | "error" | "info" | "neutral";
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "badge",
        tone === "brand" && "badge-brand",
        tone === "accent" && "badge-accent",
        tone === "success" && "badge-success",
        tone === "warning" && "badge-warning",
        tone === "error" && "badge-error",
        tone === "info" && "badge-info",
        tone === "neutral" && "border-subtle bg-surface text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------- Card ---------------------------------- */
export function Card({
  className,
  interactive,
  children,
  ...p
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div className={cx("card", interactive && "card-interactive", "p-5", className)} {...p}>
      {children}
    </div>
  );
}

/* -------------------------------- Progress --------------------------------- */
export function ProgressBar({
  value,
  tone = "brand",
  className,
  showLabel = false,
}: {
  value: number;
  tone?: "brand" | "accent" | "success";
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    tone === "accent" ? "var(--color-accent)" : tone === "success" ? "var(--color-success)" : "var(--color-brand)";
  return (
    <div className={cx("w-full", className)}>
      <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-slow"
          style={{ width: `${pct}%`, background: color }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && <span className="meta mt-1 block">{pct}%</span>}
    </div>
  );
}

/* -------------------------------- Skeleton --------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-md", className)} />;
}

/* ------------------------------ Empty / Error ------------------------------ */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6 border border-dashed border-strong rounded-panel bg-surface">
      {icon && <div className="text-muted">{icon}</div>}
      <h3 className="text-heading-sm text-primary">{title}</h3>
      {description && <p className="text-body-sm text-secondary max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong.",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="alert alert-error flex-col items-start gap-2">
      <div className="flex items-center gap-2 font-semibold text-primary">
        <span className="status-error">●</span>
        {title}
      </div>
      {description && <p className="text-body-sm text-secondary">{description}</p>}
      {onRetry && (
        <button className="btn btn-secondary btn-sm mt-1" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------ Page / Section ----------------------------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 mb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <div className="section-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-heading-lg text-primary">{title}</h1>
        {description && <p className="text-body text-secondary mt-2">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-heading-sm text-primary">{title}</h2>
        {description && <p className="text-body-sm text-secondary mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- Tabs ----------------------------------- */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-default mb-6" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "px-3 py-2 text-sm font-medium transition-colors",
            value === t.id
              ? "text-primary border-b-2 border-brand -mb-px"
              : "text-muted hover:text-secondary",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Spinner --------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("animate-spin text-brand", className)} size={18} />;
}
