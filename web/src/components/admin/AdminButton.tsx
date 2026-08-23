"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";

/** Pulsanti admin: dimensione fissa, contrasto alto, mai grigio. */
const adminButtonVariants = cva(
  cn(
    ADMIN_UI.font,
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border-2",
    "whitespace-nowrap transition-colors outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
        outline:
          "border-white/35 bg-white/10 text-white hover:border-white/55 hover:bg-white/20",
        secondary:
          "border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/45",
        ghost:
          "border-transparent bg-transparent text-white hover:bg-white/10",
        destructive:
          "border-destructive bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: ADMIN_UI.button,
        lg: ADMIN_UI.buttonPrimary,
        transport: "h-12 min-h-12 px-3 text-base font-semibold leading-none",
        icon: "size-9 min-h-9 min-w-9 p-0",
        "icon-sm": "size-9 min-h-9 min-w-9 p-0",
        "icon-lg": "size-12 min-h-12 min-w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type AdminButtonProps = ButtonPrimitive.Props &
  Omit<VariantProps<typeof adminButtonVariants>, "size"> & {
    /** Legacy shadcn sizes normalizzati alla dimensione fissa admin. */
    size?: "default" | "lg" | "transport" | "icon" | "icon-sm" | "icon-lg" | "sm" | "xs";
  };

function AdminButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: AdminButtonProps) {
  const normalizedSize: NonNullable<VariantProps<typeof adminButtonVariants>["size"]> =
    size === "sm" || size === "xs" || size === "default" || size === undefined
      ? "default"
      : size;

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(adminButtonVariants({ variant, size: normalizedSize, className }))}
      {...props}
    />
  );
}

export { AdminButton, adminButtonVariants };
