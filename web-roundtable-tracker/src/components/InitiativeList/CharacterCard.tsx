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

export function CharacterCard({
	character,
	defaultOpen = false,
	onStateChange,
}: {
	character: Character;
	defaultOpen?: boolean;
	onStateChange?: (uuid: string, newState: Character['turnState']) => void;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const badgeClass = getBadgeClass(character.turnState);

	const turnStates: Character['turnState'][] = [
		'normal',
		'delayed',
		'active',
		'knocked-out',
		'on-hold',
	];

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
							{/* Add more details as needed */}
							<div className="flex items-center gap-2 mt-2">
								<label className="font-semibold flex gap-2 items-center">
									State:
									<Select
										value={character.turnState}
										disabled={!onStateChange}
										onValueChange={(value) =>
											onStateChange?.(
												character.uuid,
												value as Character['turnState']
											)
										}
									>
										<SelectTrigger className="border rounded px-2 py-1 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{turnStates.map((state) => (
												<SelectItem key={state} value={state}>
													<Badge className={getBadgeClass(state)}>
														{state}
													</Badge>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</label>
							</div>
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
