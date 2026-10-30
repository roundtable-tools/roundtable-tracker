import {
	Asterisk,
	Brain,
	Droplet,
	Flame,
	FlaskConical,
	Ghost,
	type LucideIcon,
	Skull,
	Snowflake,
	Zap,
} from 'lucide-react';
import {
	type PersistentDamage,
	type PersistentDamageIconKey,
} from '@/store/data';

export const PERSISTENT_DAMAGE_ICONS: Record<
	PersistentDamageIconKey,
	{ Icon: LucideIcon; label: string; className: string }
> = {
	bleed: { Icon: Droplet, label: 'Bleed', className: 'text-red-400' },
	fire: { Icon: Flame, label: 'Fire', className: 'text-orange-400' },
	acid: { Icon: FlaskConical, label: 'Acid', className: 'text-lime-400' },
	cold: { Icon: Snowflake, label: 'Cold', className: 'text-sky-300' },
	electricity: {
		Icon: Zap,
		label: 'Electricity',
		className: 'text-yellow-300',
	},
	poison: { Icon: Skull, label: 'Poison', className: 'text-green-400' },
	mental: { Icon: Brain, label: 'Mental', className: 'text-fuchsia-400' },
	spirit: { Icon: Ghost, label: 'Spirit', className: 'text-indigo-300' },
	other: { Icon: Asterisk, label: 'Other', className: 'text-slate-300' },
};

/**
 * What a chip shows: the name when there is one (e.g. "2d6 fire", rolled
 * again each time), otherwise the damage last taken, or the damage type for
 * a participant without HP data.
 */
export const getPersistentDamageLabel = (damage: PersistentDamage) =>
	damage.name?.trim() ||
	(damage.amount !== undefined
		? String(damage.amount)
		: PERSISTENT_DAMAGE_ICONS[damage.icon].label);
