import { cva } from "class-variance-authority";
import { AlertCircle, FileText, Lock, Wifi } from "lucide-react";

import { cn } from "@/lib/utils"

export const EMPTY_STATE_VARIANTS = {
  NO_RESULTS: "no-results",
  NO_PERMISSIONS: "no-permissions",
  OFFLINE: "offline",
  ERROR: "error",
};

function Empty({
  variant = EMPTY_STATE_VARIANTS.NO_RESULTS,
  title,
  description,
  action,
  className,
  children,
  ...props
}) {
  const iconMap = {
    [EMPTY_STATE_VARIANTS.NO_RESULTS]: FileText,
    [EMPTY_STATE_VARIANTS.NO_PERMISSIONS]: Lock,
    [EMPTY_STATE_VARIANTS.OFFLINE]: Wifi,
    [EMPTY_STATE_VARIANTS.ERROR]: AlertCircle,
  };

  const Icon = iconMap[variant] || FileText;
  const shouldRenderSimple = Boolean(title || description || action);

  if (shouldRenderSimple) {
    return (
      <div
        data-slot="empty"
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
          className
        )}
        {...props}
      >
        <div className="rounded-full bg-muted p-4">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <div className="text-lg font-medium tracking-tight">{title || "Tidak Ada Data"}</div>
          <div className="text-muted-foreground text-sm/relaxed">
            {description || "Tidak ada data untuk ditampilkan saat ini"}
          </div>
        </div>
        {action ? <div>{action}</div> : null}
        {children}
      </div>
    );
  }

  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function EmptyHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
      {...props} />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props} />
  );
}

function EmptyTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props} />
  );
}

function EmptyDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props} />
  );
}

function EmptyContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
        className
      )}
      {...props} />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
