import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-md px-3 text-xs',
				lg: 'h-10 rounded-md px-8',
				icon: 'h-9 w-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

// When a button mixes icons and bare text, wrap the text in spans. Older iPads have no
// flexbox gap, and the .no-flex-gap fallback (globals.css) can only put margins between
// elements, not between an icon and a text node.
function wrapBareText(children: React.ReactNode) {
	const items = React.Children.toArray(children);
	const hasElement = items.some((c) => React.isValidElement(c));
	const hasText = items.some((c) => (typeof c === 'string' && c.trim() !== '') || typeof c === 'number');
	if (!hasElement || !hasText) return children;
	return items.map((c, i) =>
		(typeof c === 'string' && c.trim() !== '') || typeof c === 'number' ? <span key={`t${i}`}>{c}</span> : c
	);
}

export function Button({ className, variant, size, asChild, children, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp className={cn(buttonVariants({ variant, size, className }))} {...props}>
			{asChild ? children : wrapBareText(children)}
		</Comp>
	);
}

