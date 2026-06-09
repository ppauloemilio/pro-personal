import { cn } from "@/lib/utils";

const styles = {
  default: "bg-surface-elevated text-slate-300",
  success: "bg-brand-500/20 text-brand-300",
  warning: "bg-amber-500/20 text-amber-300",
  danger: "bg-red-500/20 text-red-300",
  info: "bg-blue-500/20 text-blue-300",
  purple: "bg-rejected-500/20 text-rejected-300",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
