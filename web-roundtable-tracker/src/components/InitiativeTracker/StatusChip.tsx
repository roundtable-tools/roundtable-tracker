import { type LucideIcon, ShieldPlus, X } from 'lucide-react';

/**
 * A small pill with an icon and a label, e.g. temp HP or a persistent damage
 * entry. With `onRemove` it has an X, named `removeLabel`.
 */
export function StatusChip({
	slot,
	Icon,
	iconClassName,
	label,
	title,
	removeLabel,
	onRemove,
	className = '',
}: {
	/** The chip's `data-slot`, so checks can find it. */
	slot: string;
	Icon: LucideIcon;
	iconClassName: string;
	label: string;
	title: string;
	removeLabel?: string;
	onRemove?: () => void;
	className?: string;
}) {
	return (
		<span
			data-slot={slot}
			title={title}
			className={`inline-flex max-w-full items-center gap-1 rounded-full border border-current/25 bg-background/40 px-2 py-0.5 text-[11px] font-medium ${className}`}
		>
			<Icon className={`h-3 w-3 shrink-0 ${iconClassName}`} />
			<span className="truncate">{label}</span>
			{onRemove && (
				<button
					type="button"
					aria-label={removeLabel}
					className="-mr-1 rounded-full p-0.5 opacity-70 hover:bg-current/15 hover:opacity-100"
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</span>
	);
}

/**
 * A participant's temp HP; with `onRemove` its X takes it away. Without
 * `tempHp` it shows that there is some, not how much (for players, who see
 * no HP numbers).
 */
export function TempHpChip({
	tempHp,
	description,
	onRemove,
	className,
}: {
	tempHp?: number;
	description?: string;
	onRemove?: () => void;
	className?: string;
}) {
	return (
		<StatusChip
			slot="temp-hp-chip"
			Icon={ShieldPlus}
			iconClassName="text-sky-400"
			label={tempHp === undefined ? 'Temp HP' : `+${tempHp}`}
			title={
				tempHp === undefined
					? 'Temp HP'
					: `Temp HP: ${tempHp}${description ? ` (${description})` : ''}`
			}
			removeLabel="Remove temp HP"
			onRemove={onRemove}
			className={className}
		/>
	);
}
