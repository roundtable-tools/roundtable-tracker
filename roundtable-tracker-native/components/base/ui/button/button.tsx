import { Pressable } from 'react-native';
import * as React from 'react';
import { cn } from '@/components/base/lib/utils';
import { TextClassContext } from '@/components/base/ui/text';
import { buttonVariants, buttonTextVariants } from './variants';
import { VariantProps } from 'class-variance-authority';

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
	VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<
	React.ElementRef<typeof Pressable>,
	ButtonProps
>(({ className, variant, size, ...props }, ref) => {
	return (
		<TextClassContext.Provider
			value={buttonTextVariants({
				variant,
				size,
				className: 'web:pointer-events-none',
			})}
		>
			<Pressable
				className={cn(
					props.disabled && 'opacity-50 web:pointer-events-none',
					buttonVariants({ variant, size, className })
				)}
				ref={ref}
				role="button"
				{...props}
			/>
		</TextClassContext.Provider>
	);
});
Button.displayName = 'Button';

export { Button };

export type { ButtonProps };
