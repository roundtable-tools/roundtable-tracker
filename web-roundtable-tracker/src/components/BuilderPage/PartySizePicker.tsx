import { User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PartySizePickerProps {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	onBlur?: () => void;
	name?: string;
	ref?: React.Ref<HTMLButtonElement>;
}

const PARTY_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function PartySizePicker({
	value,
	onChange,
	onBlur,
	name,
	ref: forwardedRef,
}: PartySizePickerProps) {
	const safeValue =
		typeof value === 'number' && Number.isFinite(value)
			? Math.min(Math.max(Math.round(value), 1), 8)
			: 4;

	return (
		<div className="inline-flex flex-col gap-1.5">
			<div className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 shadow-xs">
				<div
					role="radiogroup"
					aria-label="Party size"
					className="inline-flex items-center gap-1"
				>
					{PARTY_SIZE_OPTIONS.map((option) => {
						const isActive = option <= safeValue;
						const isSelected = option === safeValue;

						return (
							<Button
								key={option}
								ref={isSelected ? forwardedRef : undefined}
								type="button"
								name={name}
								role="radio"
								aria-checked={isSelected}
								aria-label={`${option} player${option === 1 ? '' : 's'}`}
								variant="ghost"
								size="icon"
								className={cn(
									'size-8 rounded-full border border-transparent transition-colors',
									isActive
										? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30'
										: 'text-muted-foreground/50 hover:text-muted-foreground',
									isSelected && 'border-amber-500/60 ring-1 ring-amber-500/40'
								)}
								onClick={() => {
									onChange(option);
									onBlur?.();
								}}
							>
								<User className="size-4" />
							</Button>
						);
					})}
				</div>
				<div className="min-w-10 text-right text-xs font-medium text-muted-foreground">
					{safeValue} / 8
				</div>
			</div>
		</div>
	);
}
