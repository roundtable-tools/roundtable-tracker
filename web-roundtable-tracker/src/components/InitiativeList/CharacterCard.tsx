import { useState } from 'react';
import { Character } from '@/store/data';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ChevronDown } from 'lucide-react';
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from '../ui/collapsible';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '../ui/select';
import { Input } from '../ui/input';

// Map character state to shadcn/ui badge color using shadcn palette classes
const STATE_BADGE_COLOR: Record<Character['turnState'], string> = {
	normal: 'bg-green-200 text-green-800',
	delayed: 'bg-yellow-100 text-yellow-800',
	active: 'bg-blue-200 text-blue-800',
	'knocked-out': 'bg-red-200 text-red-800',
	'on-hold': 'bg-gray-200 text-gray-800',
	// Add more states as needed
};

// Improved CharacterCard: more modular, readable, and maintainable
function CharacterDetailRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	if (value === undefined || value === null || value === '') return null;

	return (
		<div className="flex items-center gap-1">
			<span className="font-semibold">{label}:</span> {value}
		</div>
	);
}

// Returns the badge class for a character's state
function getBadgeClass(turnState: Character['turnState']): string {
	return (
		STATE_BADGE_COLOR[
			(turnState?.toLowerCase?.() as keyof typeof STATE_BADGE_COLOR) ?? 'normal'
		] || 'bg-gray-200 text-gray-800'
	);
}

// Health status indicator component
function HealthStatus({
	health,
	maxHealth,
}: {
	health: number;
	maxHealth: number;
}) {
	if (
		typeof health !== 'number' ||
		typeof maxHealth !== 'number' ||
		maxHealth <= 0
	)
		return null;
	const ratio = health / maxHealth;
	let color = 'text-red-700';
	if (ratio > 0.75) color = 'text-green-700';
	else if (ratio > 0.5) color = 'text-yellow-500';
	else if (ratio > 0.25) color = 'text-amber-500';
	return (
		<span className={`font-semibold ml-2 ${color}`}>
			{`(${Math.round(ratio * 100)}%)`}
		</span>
	);
}

function HealthControls({
	character,
	onStateChange,
}: {
	character: Character;
	onStateChange?: (uuid: string, update: Partial<Character>) => void;
}) {
	const [damage, setDamage] = useState('');
	function handleDealDamage(e: React.FormEvent) {
		e.preventDefault();
		const dmg = Number(damage);
		if (isNaN(dmg) || dmg <= 0) return;
		let temp = character.tempHealth ?? 0;
		let health = character.health ?? 0;
		let tempUsed = Math.min(temp, dmg);
		let healthUsed = Math.max(0, dmg - tempUsed);
		onStateChange?.(character.uuid, {
			tempHealth: temp - tempUsed,
			health: Math.max(0, health - healthUsed),
		});
		setDamage('');
	}
	return (
		<div className="flex flex-wrap items-center gap-2 mt-2">
			<label className="font-semibold flex gap-2 items-center">
				Health:
				<Input
					type="number"
					className="w-16 text-xs px-1 py-0.5"
					value={character.health ?? 0}
					onChange={(e) =>
						onStateChange?.(character.uuid, {
							health: Number(e.target.value),
						})
					}
				/>
			</label>
			<label className="font-semibold flex gap-2 items-center">
				Temp:
				<Input
					type="number"
					className="w-16 text-xs px-1 py-0.5"
					value={character.tempHealth ?? 0}
					onChange={(e) =>
						onStateChange?.(character.uuid, {
							tempHealth: Number(e.target.value),
						})
					}
				/>
			</label>
			<label className="font-semibold flex gap-2 items-center">
				Max:
				<Input
					type="number"
					className="w-16 text-xs px-1 py-0.5"
					value={character.maxHealth ?? 0}
					onChange={(e) =>
						onStateChange?.(character.uuid, {
							maxHealth: Number(e.target.value),
						})
					}
				/>
			</label>
			<form onSubmit={handleDealDamage} className="flex gap-1 items-center">
				<Input
					type="number"
					min={1}
					placeholder="Damage"
					className="w-16 text-xs px-1 py-0.5"
					value={damage}
					onChange={(e) => setDamage(e.target.value)}
				/>
				<Button type="submit" size="sm" className="px-2 py-1 text-xs">
					Deal
				</Button>
			</form>
		</div>
	);
}

function StateSelect({
	character,
	onStateChange,
}: {
	character: Character;
	onStateChange?: (uuid: string, update: Partial<Character>) => void;
}) {
	const turnStates: Character['turnState'][] = [
		'normal',
		'delayed',
		'active',
		'knocked-out',
		'on-hold',
	];
	return (
		<div className="flex items-center gap-2 mt-2">
			<label className="font-semibold flex gap-2 items-center">
				State:
				<Select
					value={character.turnState}
					disabled={!onStateChange}
					onValueChange={(value) =>
						onStateChange?.(character.uuid, {
							turnState: value as Character['turnState'],
						})
					}
				>
					<SelectTrigger className="border rounded px-2 py-1 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{turnStates.map((state) => (
							<SelectItem key={state} value={state}>
								<Badge className={getBadgeClass(state)}>{state}</Badge>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</label>
		</div>
	);
}

export function CharacterCard({
	character,
	defaultOpen = false,
	onStateChange,
}: {
	character: Character;
	defaultOpen?: boolean;
	onStateChange?: (uuid: string, update: Partial<Character>) => void;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const badgeClass = getBadgeClass(character.turnState);

	return (
		<Card className={cn('w-full max-w-md p-2 px-4')}>
			{/* Collapsible component for character details */}
			<Collapsible open={open} onOpenChange={setOpen}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full flex items-center gap-3 select-none p-0 bg-transparent border-0 text-left cursor-pointer"
						aria-expanded={open}
					>
						<div className="flex-1 flex items-center gap-2">
							<span className="font-bold text-lg truncate max-w-[10ch] md:max-w-none">
								{character.name}
							</span>
							{character.turnState != 'normal' && (
								<Badge className={badgeClass}>{character.turnState}</Badge>
							)}
						</div>
						<span className="text-base font-mono whitespace-nowrap">
							{character.health ?? 0}
							{character.tempHealth ? ` +${character.tempHealth}` : ''}
							{' / '}
							{character.maxHealth ?? 0}
							<HealthStatus
								health={character.health ?? 0}
								maxHealth={character.maxHealth ?? 0}
							/>
						</span>
						<ChevronDown
							className={`ml-2 w-5 h-5 transition-transform duration-200 ${
								open ? 'rotate-180' : ''
							}`}
							aria-label={open ? 'Collapse details' : 'Expand details'}
						/>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent>
						<div className="flex flex-col gap-2 text-sm">
							<CharacterDetailRow label="Level" value={character.level} />
							<CharacterDetailRow label="Group" value={character.group} />
							<CharacterDetailRow label="Wounded" value={character.wounded} />
							<CharacterDetailRow
								label="Knocked By"
								value={character.knockedBy}
							/>
							{onStateChange && (
								<HealthControls
									character={character}
									onStateChange={onStateChange}
								/>
							)}
							<StateSelect
								character={character}
								onStateChange={onStateChange}
							/>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

// QuickAccessGrid: shows buttons for characters on hold or delayed
export function QuickAccessGrid({
	characters,
	onStateChange,
}: {
	characters: Character[];
	onStateChange: (uuid: string, newState: Character['turnState']) => void;
}) {
	if (!characters.length) return null;

	return (
		<section className="mb-4">
			<h3 className="font-semibold text-base mb-2">Return to Initiative</h3>
			<div className="flex flex-wrap gap-2">
				{characters.map((char) => {
					const badgeClass = getBadgeClass(char.turnState) + ' opacity-50';

					return (
						<Button
							key={char.uuid}
							variant="outline"
							onClick={() => onStateChange(char.uuid, 'active')}
							title={`Return ${char.name} to initiative`}
							className="flex items-center gap-1 px-2 py-1 text-xs min-w-0"
							disabled={!char.hasTurn}
						>
							<span className="" title={char.name}>
								{char.name}
							</span>

							<Badge className={badgeClass}>{char.turnState}</Badge>
						</Button>
					);
				})}
			</div>
		</section>
	);
}
