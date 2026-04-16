import { Party, PARTY_ICONS, PartyIcon } from '@/store/savedParties';
import { cn } from '@/lib/utils';
import {
	User, Users, Shield, Sword, Wand2, Star, Crown, Flame, Zap, Skull, Heart, Axe, Sparkles, Ghost,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PARTY_ICON_MAP: Record<PartyIcon, LucideIcon> = {
	User,
	Users,
	Shield,
	Sword,
	Wand2,
	Star,
	Crown,
	Flame,
	Zap,
	Skull,
	Heart,
	Axe,
	Sparkles,
	Swords: Sword, // fallback — Swords not in lucide-react, use Sword
	Ghost,
};

export function partyLevelRange(party: Party): string {
	if (party.members.length === 0) return '—';
	const levels = party.members.map((m) => m.level);
	const min = Math.min(...levels);
	const max = Math.max(...levels);

	return min === max ? `${min}` : `${min}–${max}`;
}

type PartyCardProps = {
	party: Party;
	layout: 'list' | 'grid' | 'big-grid';
	onEdit: () => void;
	onCopy: () => void;
	onDelete: () => void;
};

export function PartyCard({ party, layout, onEdit, onCopy, onDelete }: PartyCardProps) {
	const Icon = PARTY_ICON_MAP[party.icon] ?? User;
	const levelRange = partyLevelRange(party);
	const memberCount = party.members.length;

	if (layout === 'list') {
		return (
			<div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Icon className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold">{party.name}</p>
					<p className="text-xs text-muted-foreground">
						{memberCount} member{memberCount !== 1 ? 's' : ''} · Levels {levelRange}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						Edit
					</button>
					<button
						type="button"
						onClick={onCopy}
						className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						Copy
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
					>
						Delete
					</button>
				</div>
			</div>
		);
	}

	if (layout === 'grid') {
		return (
			<div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-sm">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Icon className="h-6 w-6" />
				</div>
				<p className="w-full truncate text-center text-sm font-semibold">{party.name}</p>
				<p className="text-xs text-muted-foreground">
					{memberCount} · Lv {levelRange}
				</p>
				<div className="flex gap-1">
					<button
						type="button"
						onClick={onEdit}
						className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						Edit
					</button>
					<button
						type="button"
						onClick={onCopy}
						className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						Copy
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
					>
						Del
					</button>
				</div>
			</div>
		);
	}

	// big-grid
	return (
		<div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 shadow-sm">
			<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<Icon className="h-10 w-10" />
			</div>
			<p className="text-lg font-semibold">{party.name}</p>
			<p className="text-sm text-muted-foreground">
				{memberCount} member{memberCount !== 1 ? 's' : ''} · Levels {levelRange}
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={onEdit}
					className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent"
				>
					Edit
				</button>
				<button
					type="button"
					onClick={onCopy}
					className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent"
				>
					Copy
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
				>
					Delete
				</button>
			</div>
		</div>
	);
}

type IconPickerProps = {
	value: PartyIcon;
	onChange: (icon: PartyIcon) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{PARTY_ICONS.map((iconName) => {
				const Icon = PARTY_ICON_MAP[iconName] ?? User;
				const isSelected = value === iconName;

				return (
					<button
						key={iconName}
						type="button"
						title={iconName}
						onClick={() => onChange(iconName)}
						className={cn(
							'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
							isSelected
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent'
						)}
					>
						<Icon className="h-5 w-5" />
					</button>
				);
			})}
		</div>
	);
}
