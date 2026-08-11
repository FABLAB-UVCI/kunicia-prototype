type Ton = "neutral" | "primary" | "warning" | "danger";

const STYLES: Record<Ton, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-secondary text-secondary-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Ton }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STYLES[tone]}`}>
      {label}
    </span>
  );
}
