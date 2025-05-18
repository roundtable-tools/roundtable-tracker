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

export function CharacterCard({
	character,
	defaultOpen = false,
}: {
	character: Character;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const badgeClass =
		STATE_BADGE_COLOR[
			(character.turnState?.toLowerCase?.() as keyof typeof STATE_BADGE_COLOR) ??
				'normal'
		] ?? 'bg-gray-200 text-gray-800';

	return (
		<Card className="w-full max-w-md  p-2 px-4">
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
							<Badge
								className={badgeClass}
								variant={undefined /* override variant to allow custom bg */}
							>
								{character.turnState}
							</Badge>
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
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
