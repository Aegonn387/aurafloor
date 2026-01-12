import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 sm:px-4 py-2 has-[>svg]:px-2 sm:has-[>svg]:px-3 text-sm',
        sm: 'h-8 rounded-md gap-1.5 px-2.5 sm:px-3 has-[>svg]:px-2 sm:has-[>svg]:px-2.5 text-xs sm:text-sm',
        lg: 'h-10 sm:h-11 rounded-md px-4 sm:px-6 has-[>svg]:px-3 sm:has-[>svg]:px-4 text-sm sm:text-base',
        icon: 'size-8 sm:size-9',
        'icon-sm': 'size-7 sm:size-8',
        'icon-lg': 'size-9 sm:size-10 md:size-12',
        'touch': 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-base sm:text-sm sm:min-h-9 sm:min-w-auto',
      },
      responsive: {
        true: 'text-xs sm:text-sm md:text-base',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      responsive: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, responsive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, responsive, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
