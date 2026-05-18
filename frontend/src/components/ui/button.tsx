import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/90 via-primary to-primary/95 text-primary-foreground " +
          "shadow-[0_1px_2px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] " +
          "border border-black/10 " +
          "hover:from-primary/85 hover:via-primary/95 hover:to-primary " +
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] " +
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:from-primary active:to-primary/90",
        brand:
          "bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 text-white " +
          "shadow-[0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(196,107,60,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] " +
          "border border-brand-700/30 " +
          "hover:from-brand-400 hover:via-brand-500 hover:to-brand-600 " +
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_4px_8px_rgba(196,107,60,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] " +
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:from-brand-700 active:to-brand-800",
        destructive:
          "bg-gradient-to-b from-destructive/90 via-destructive to-destructive/95 text-white " +
          "shadow-[0_1px_2px_rgba(0,0,0,0.2),0_1px_3px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] " +
          "border border-black/10 " +
          "hover:from-destructive/85 hover:via-destructive/95 hover:to-destructive " +
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_4px_8px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] " +
          "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:from-destructive active:to-destructive/90 " +
          "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-gradient-to-b from-white to-gray-50/80 text-foreground " +
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] " +
          "hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 " +
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.06)] " +
          "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] active:from-gray-100 active:to-gray-200 " +
          "dark:border-input dark:bg-input/30 dark:from-transparent dark:to-transparent dark:hover:bg-input/50 dark:hover:from-transparent dark:hover:to-transparent",
        secondary:
          "bg-gradient-to-b from-secondary/90 via-secondary to-secondary/95 text-secondary-foreground " +
          "shadow-[0_1px_1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] " +
          "border border-black/5 " +
          "hover:from-secondary/80 hover:via-secondary/90 hover:to-secondary " +
          "hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] " +
          "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] active:from-secondary active:to-secondary/90",
        ghost:
          "text-foreground " +
          "hover:bg-gradient-to-b hover:from-accent/80 hover:to-accent/40 " +
          "hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] " +
          "hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
