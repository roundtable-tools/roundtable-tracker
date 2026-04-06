import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Hourglass, Trash2, UserPlus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEncounterStore } from '@/store/instance';
import { Character } from '@/store/data';

type InitiativeListProps = {
	charactersIds: string[];
	charactersMap: Record<string, Character>;
	activeIndex: number;
	expanded: string | null;
	setExpanded: (id: string | null) => void;
	handleRemove: (id: string) => void;
	handleGiveTurn: (id: string) => void;
	handleSetHp: (id: string) => void;
	handleSetTempHp: (id: string) => void;
	hpInput: string;
	tempHpInput: string;
	setHpInput: (v: string) => void;
	setTempHpInput: (v: string) => void;
};

// DelayedCharacterCard component
const DelayedCharacterCard = ({
	character,
	onRemove,
	onGiveTurn,
	onDelay,
}: {
	character: Character | undefined;
	onRemove: () => void;
	onGiveTurn: () => void;
	onDelay: () => void;
}) => {
	if (!character) return null;

	return (
		<Card className="transition-all border-yellow-400 border-2 bg-yellow-50 w-full md:w-[500px] mx-auto opacity-90">
			<CardHeader className="flex flex-row items-center justify-between cursor-pointer px-3 py-2">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<span className="font-semibold shrink-0">
						[{character.initiative}]
					</span>
					<span className="truncate max-w-[120px]">{character.name}</span>
					<span className="text-xs text-yellow-700 shrink-0">delayed</span>
					<Hourglass className="w-4 h-4 ml-1 text-yellow-500" />
				</div>
				<div className="flex gap-1 ml-2">
					<Button
						size="icon"
						variant="destructive"
						onClick={onRemove}
						title="Remove"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
					<Button
						size="icon"
						variant="outline"
						onClick={onGiveTurn}
						title="Extra Turn"
					>
						<UserPlus className="w-4 h-4" />
					</Button>
					<Button
						size="icon"
						variant="outline"
						onClick={onDelay}
						title="Remove Delay"
					>
						<UserPlus className="w-4 h-4 rotate-180" />
					</Button>
				</div>
			</CardHeader>
		</Card>
	);
};

// MainCharacterCard component
const MainCharacterCard = ({
	character,
	isActive,
	isExpanded,
	onExpand,
	onRemove,
	onGiveTurn,
	onDelay,
	hpInput,
	tempHpInput,
	onSetHp,
	onSetTempHp,
	setHpInput,
	setTempHpInput,
}: {
	character: Character | undefined;
	isActive: boolean;
	isExpanded: boolean;
	onExpand: () => void;
	onRemove: () => void;
	onGiveTurn: () => void;
	onDelay: () => void;
	hpInput: string;
	tempHpInput: string;
	onSetHp: () => void;
	onSetTempHp: () => void;
	setHpInput: (v: string) => void;
	setTempHpInput: (v: string) => void;
}) => {
	if (!character) return null;

	return (
		<Card
			key={character.uuid}
			className={`transition-all ${
				isActive ? 'border-primary border-2' : ''
			} w-full md:w-[500px] mx-auto`}
		>
			<CardHeader
				className="flex flex-row items-center justify-between cursor-pointer px-3 py-2"
				onClick={onExpand}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<span className="font-semibold shrink-0">
						[{character.initiative}]
					</span>
					<span className="truncate max-w-[120px]">{character.name}</span>
					<span className="text-xs text-muted-foreground shrink-0">
						{character.turnState}
					</span>
					{character.turnState === 'delayed' && (
						<Hourglass className="w-4 h-4 ml-1 text-yellow-500" />
					)}
				</div>
				<div className="flex gap-1 ml-2">
					<Button
						size="icon"
						variant="destructive"
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						title="Remove"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
					<Button
						size="icon"
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onGiveTurn();
						}}
						title="Extra Turn"
					>
						<UserPlus className="w-4 h-4" />
					</Button>
					<Button
						size="icon"
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onDelay();
						}}
						title="Delay"
					>
						<Hourglass className="w-4 h-4" />
					</Button>
				</div>
				<ChevronDown
					className={`w-4 h-4 transition-transform ${
						isExpanded ? 'rotate-180' : ''
					}`}
				/>
			</CardHeader>
			{isExpanded && (
				<CardContent className="space-y-2 px-3 py-2">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span>
							HP: {character.health}/{character.maxHealth}
						</span>
						<span>Temp: {character.tempHealth ?? 0}</span>
						<input
							type="number"
							placeholder="+/-HP"
							value={hpInput}
							onChange={(e) => setHpInput(e.target.value)}
							className="input input-xs w-16 border rounded px-2 py-1"
						/>
						<Button size="sm" onClick={onSetHp}>
							HP
						</Button>
						<input
							type="number"
							placeholder="Temp"
							value={tempHpInput}
							onChange={(e) => setTempHpInput(e.target.value)}
							className="input input-xs w-16 border rounded px-2 py-1"
						/>
						<Button size="sm" onClick={onSetTempHp}>
							Temp
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	);
};

const InitiativeList = ({
	charactersIds,
	charactersMap,
	activeIndex,
	expanded,
	setExpanded,
	handleRemove,
	handleGiveTurn,
	handleSetHp,
	handleSetTempHp,
	hpInput,
	tempHpInput,
	setHpInput,
	setTempHpInput,
	onDelay,
	delayedIds,
}: InitiativeListProps & {
	onDelay: (id: string) => void;
	delayedIds: string[];
}) => {
	const mainIds = charactersIds.filter((id) => !delayedIds.includes(id));

	return (
		<div className="space-y-2">
			{delayedIds.length > 0 && (
				<div className="space-y-2">
					{delayedIds.map((id: string) => (
						<DelayedCharacterCard
							key={id}
							character={charactersMap[id]}
							onRemove={() => handleRemove(id)}
							onGiveTurn={() => handleGiveTurn(id)}
							onDelay={() => onDelay(id)}
						/>
					))}
				</div>
			)}

			{mainIds.map((id: string, idx: number) => (
				<MainCharacterCard
					key={id}
					character={charactersMap[id]}
					isActive={idx === activeIndex}
					isExpanded={expanded === id}
					onExpand={() => setExpanded(expanded === id ? null : id)}
					onRemove={() => handleRemove(id)}
					onGiveTurn={() => handleGiveTurn(id)}
					onDelay={() => onDelay(id)}
					hpInput={hpInput}
					tempHpInput={tempHpInput}
					onSetHp={() => handleSetHp(id)}
					onSetTempHp={() => handleSetTempHp(id)}
					setHpInput={setHpInput}
					setTempHpInput={setTempHpInput}
				/>
			))}
		</div>
	);
};

export const AlternativeList = () => {
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const updateCharacter = useEncounterStore((state) => state.updateCharacter);
	const setCharacters = useEncounterStore((state) => state.setCharacters);
	const [round, setRound] = useState(1);
	const [activeIndex, setActiveIndex] = useState(0);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [charactersIds, setCharactersIds] = useState(charactersOrder);
	const [hpInput, setHpInput] = useState('');
	const [tempHpInput, setTempHpInput] = useState('');
	const [delayedIds, setDelayedIds] = useState<string[]>(() =>
		charactersOrder.filter((id) => charactersMap[id]?.turnState === 'delayed')
	);

	// Keep delayedIds in sync with store
	useEffect(() => {
		setCharactersIds(charactersOrder);
		setDelayedIds(
			charactersOrder.filter((id) => charactersMap[id]?.turnState === 'delayed')
		);
	}, [charactersOrder, charactersMap]);

	const mainIds = charactersIds.filter((id) => !delayedIds.includes(id));
	const movedCount = activeIndex;

	const handleNextTurn = () => {
		if (activeIndex < mainIds.length - 1) setActiveIndex(activeIndex + 1);
	};
	const handleEndRound = () => {
		setActiveIndex(0);
		setRound(round + 1);
	};

	const handleRemove = useCallback(
		(id: string) => {
			const newOrder = charactersIds.filter((cid) => cid !== id);
			setCharactersIds(newOrder);
			setCharacters(newOrder.map((cid) => charactersMap[cid]));
		},
		[charactersIds, setCharacters, charactersMap]
	);

	const handleGiveTurn = useCallback(
		(id: string) => {
			const idx = charactersIds.indexOf(id);

			if (idx === -1 || idx === charactersIds.length - 1) return;
			const newOrder = [...charactersIds];
			newOrder.splice(idx, 1);
			newOrder.splice(idx + 1, 0, id);
			setCharactersIds(newOrder);
		},
		[charactersIds]
	);

	const handleSetHp = useCallback(
		(id: string) => {
			const character = charactersMap[id];

			if (!character) return;
			const value = parseInt(hpInput, 10);

			if (isNaN(value)) return;
			updateCharacter(id, {
				...character,
				health: Math.max(
					0,
					Math.min(character.maxHealth, character.health + value)
				),
			});
			setHpInput('');
		},
		[charactersMap, hpInput, updateCharacter]
	);

	const handleSetTempHp = useCallback(
		(id: string) => {
			const character = charactersMap[id];

			if (!character) return;
			const value = parseInt(tempHpInput, 10);

			if (isNaN(value)) return;
			updateCharacter(id, { ...character, tempHealth: Math.max(0, value) });
			setTempHpInput('');
		},
		[charactersMap, tempHpInput, updateCharacter]
	);

	const handleDelay = useCallback(
		(id: string) => {
			const character = charactersMap[id];

			if (!character) return;

			if (character.turnState !== 'delayed') {
				updateCharacter(id, { ...character, turnState: 'delayed' });
				setDelayedIds((prev) => [...prev, id]);
			} else {
				updateCharacter(id, { ...character, turnState: 'normal' });
				setDelayedIds((prev) => {
					const newDelayed = prev.filter((d) => d !== id);
					setCharactersIds((current) => [
						id,
						...current.filter((cid) => cid !== id),
					]);
					setActiveIndex(0);

					return newDelayed;
				});
			}
		},
		[charactersMap, updateCharacter]
	);

	// Ensure activeIndex is always valid
	useEffect(() => {
		if (activeIndex >= mainIds.length) setActiveIndex(0);
	}, [mainIds.length, activeIndex]);

	return (
		<div className="max-w-2xl mx-auto space-y-6 px-2">
			{/* Header Section */}
			<div className="flex flex-col gap-2 border-b pb-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="text-2xl font-bold">
						Pathfinder 2e Initiative Tracker
					</div>
					<div className="flex gap-2 mt-2 sm:mt-0">
						<Button onClick={handleEndRound} variant="outline" size="sm">
							End
						</Button>
						<Button onClick={handleNextTurn} variant="default" size="sm">
							Next
						</Button>
					</div>
				</div>
				<div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
					<span>Round {round}</span>
					<span>
						Moved: {movedCount} / {charactersIds.length}
					</span>
				</div>
			</div>

			{/* Initiative List */}
			<InitiativeList
				charactersIds={mainIds}
				charactersMap={charactersMap}
				activeIndex={activeIndex}
				expanded={expanded}
				setExpanded={setExpanded}
				handleRemove={handleRemove}
				handleGiveTurn={handleGiveTurn}
				handleSetHp={handleSetHp}
				handleSetTempHp={handleSetTempHp}
				hpInput={hpInput}
				tempHpInput={tempHpInput}
				setHpInput={setHpInput}
				setTempHpInput={setTempHpInput}
				onDelay={handleDelay}
				delayedIds={delayedIds}
			/>
			<Separator />
		</div>
	);
};
