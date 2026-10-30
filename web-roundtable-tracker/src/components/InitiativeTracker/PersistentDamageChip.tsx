import { type ReactNode } from 'react';
import { type PersistentDamage } from '@/store/data';
import {
	getPersistentDamageLabel,
	PERSISTENT_DAMAGE_ICONS,
} from './persistentDamage';
import { StatusChip } from './StatusChip';

/**
 * A persistent damage entry: its damage type icon and its label. With
 * `onRemove` it has an X that ends it.
 */
export function PersistentDamageChip({
	damage,
	onRemove,
	className,
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
		<StatusChip
			slot="persistent-damage-chip"
			Icon={Icon}
			iconClassName={iconClassName}
			label={label}
			title={`Persistent ${type.toLowerCase()} damage: ${label}`}
			removeLabel={`End persistent damage ${label}`}
			onRemove={onRemove}
			className={className}
		/>
	);
}

/**
 * Every persistent damage entry of a participant, one chip each, after
 * `children` (e.g. a temp HP chip).
 */
export function PersistentDamageChips({
	damages,
	className = '',
	children,
}: {
	damages: PersistentDamage[] | undefined;
	className?: string;
	children?: ReactNode;
}) {
	if (!damages?.length && !children) return null;

	return (
		<span className={`flex flex-wrap gap-1 ${className}`}>
			{children}
			{damages?.map((damage) => (
				<PersistentDamageChip key={damage.id} damage={damage} />
			))}
		</span>
	);
}
