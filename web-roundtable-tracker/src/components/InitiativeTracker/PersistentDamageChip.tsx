import { X } from 'lucide-react';
import { type PersistentDamage } from '@/store/data';
import {
	getPersistentDamageLabel,
	PERSISTENT_DAMAGE_ICONS,
} from './persistentDamage';

/**
 * A persistent damage entry: its damage type icon and its label. With
 * `onRemove` it has an X that ends it.
 */
export function PersistentDamageChip({
	damage,
	onRemove,
	className = '',
}: {
	damage: PersistentDamage;
	onRemove?: () => void;
	className?: string;
}) {
	const {
		Icon,
		label: type,
		className: iconClassName,
	} = PERSISTENT_DAMAGE_ICONS[damage.icon];
	const label = getPersistentDamageLabel(damage);

	return (
		<span
			data-slot="persistent-damage-chip"
			title={`Persistent ${type.toLowerCase()} damage: ${label}`}
			className={`inline-flex max-w-full items-center gap-1 rounded-full border border-current/25 bg-background/40 px-2 py-0.5 text-[11px] font-medium ${className}`}
		>
			<Icon className={`h-3 w-3 shrink-0 ${iconClassName}`} />
			<span className="truncate">{label}</span>
			{onRemove && (
				<button
					type="button"
					aria-label={`End persistent damage ${label}`}
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

/** Every persistent damage entry of a participant, one chip each. */
export function PersistentDamageChips({
	damages,
	className = '',
	chipClassName,
}: {
	damages: PersistentDamage[] | undefined;
	className?: string;
	chipClassName?: string;
}) {
	if (!damages?.length) return null;

	return (
		<span
			aria-label="Persistent damage"
			className={`flex flex-wrap gap-1 ${className}`}
		>
			{damages.map((damage) => (
				<PersistentDamageChip
					key={damage.id}
					damage={damage}
					className={chipClassName}
				/>
			))}
		</span>
	);
}
