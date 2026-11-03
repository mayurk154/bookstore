import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-sky-400 to-primary text-primary-foreground shadow-[5px_5px_12px_hsl(var(--neu-dark)/0.8),-4px_-4px_10px_hsl(var(--neu-light)/0.9)] hover:brightness-105 active:shadow-[inset_3px_3px_7px_rgba(0,60,100,0.35)]',
        destructive: 'bg-destructive text-destructive-foreground shadow-[4px_4px_10px_hsl(var(--neu-dark)/0.8),-4px_-4px_10px_hsl(var(--neu-light)/0.9)] hover:bg-destructive/90',
        outline: 'bg-card text-foreground shadow-[4px_4px_10px_hsl(var(--neu-dark)/0.75),-4px_-4px_10px_hsl(var(--neu-light)/0.95)] hover:text-primary active:shadow-[inset_3px_3px_7px_hsl(var(--neu-dark)/0.8),inset_-3px_-3px_7px_hsl(var(--neu-light)/0.9)]',
        secondary: 'bg-secondary text-secondary-foreground shadow-[3px_3px_8px_hsl(var(--neu-dark)/0.7),-3px_-3px_8px_hsl(var(--neu-light)/0.9)] hover:bg-secondary/80',
        ghost: 'hover:bg-card hover:text-primary hover:shadow-[3px_3px_8px_hsl(var(--neu-dark)/0.6),-3px_-3px_8px_hsl(var(--neu-light)/0.9)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
