import { User, LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PartySizePickerProps {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	onBlur?: () => void;
	name?: string;
	ref?: React.Ref<HTMLButtonElement>;
	min?: number;
	max?: number;
	options?: readonly number[];
	icon?: LucideIcon;
	rows?: number;
	buttonSize?: 'sm' | 'md' | 'xl';
	showReadout?: boolean;
}

export function PartySizePicker({
	value,
	onChange,
	onBlur,
	name,
	ref: forwardedRef,
	min = 1,
	max = 8,
	options: customOptions,
	icon: Icon = User,
	rows = 1,
	buttonSize = 'md',
	showReadout = true,
}: PartySizePickerProps) {
	const computedOptions =
		customOptions && customOptions.length > 0
			? Array.from(customOptions)
			: Array.from({ length: max - min + 1 }, (_, i) => min + i);

	const safeValue =
		typeof value === 'number' && Number.isFinite(value)
			? Math.min(Math.max(Math.round(value), min), max)
			: min;

	// Split options into rows
	const optionsPerRow = Math.ceil(computedOptions.length / rows);
	const rowsArray = Array.from({ length: rows }, (_, rowIdx) =>
		computedOptions.slice(rowIdx * optionsPerRow, (rowIdx + 1) * optionsPerRow)
	);

	const buttonSizeClass =
		buttonSize === 'sm' ? 'size-6' : buttonSize === 'xl' ? 'size-12' : 'size-8';
	const iconSizeClass =
		buttonSize === 'sm' ? 'size-3' : buttonSize === 'xl' ? 'size-6' : 'size-4';
	const wrapperClass = buttonSize === 'xl' ? 'px-3 py-2' : 'px-2 py-1.5';

	const renderButtonRows = () => {
		return rowsArray.map((rowOptions, rowIdx) => (
			<div
				key={rowIdx}
				className="inline-flex items-center gap-1"
				role={rowIdx === 0 ? 'radiogroup' : undefined}
				aria-label={rowIdx === 0 ? 'Party size' : undefined}
			>
				{rowOptions.map((option) => {
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
							aria-label={`${option}`}
							variant="ghost"
							size={buttonSize === 'sm' ? 'sm' : 'icon'}
							className={cn(
								`${buttonSizeClass} rounded-full border border-transparent transition-colors`,
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
							<Icon className={iconSizeClass} />
						</Button>
					);
				})}
			</div>
		));
	};

	return (
		<div className="inline-flex flex-col gap-2">
			{showReadout && (
				<div className="min-w-10 text-right text-xs font-medium text-muted-foreground">
					{safeValue} / {max}
				</div>
			)}
			<div
				className={cn(
					'inline-flex flex-col gap-1 rounded-md border bg-background shadow-xs',
					wrapperClass
				)}
			>
				{renderButtonRows()}
			</div>
		</div>
	);
}
