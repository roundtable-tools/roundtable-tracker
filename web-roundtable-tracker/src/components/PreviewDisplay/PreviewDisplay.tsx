import {
	ALIGNMENT,
	CharacterConfig,
	DIFFICULTY,
	difficultyToString,
	Encounter,
	indexToLetter,
	InitiativeParticipant,
	normalizeLevel,
	Participant,
	PRIORITY,
} from '@/store/data';
import { generateUUID } from '@/utils/uuid';
import { PreviewCard } from './PreviewCard';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/AppHeader';
import {
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from '@/store/convert';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Bot, Trees, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSavedPartiesStore } from '@/store/savedPartiesInstance';
import { Party } from '@/store/savedParties';

type PreviewDisplayProps = {
	setView: (view: string) => void;
};

type PreviewCharacterConfig = CharacterConfig & {
	hasHealthData?: boolean;
};

type TeamAppearance = {
	borderClassName: string;
	markerClassName: string;
	textClassName: string;
	label: string;
	Icon: LucideIcon;
};

const TEAM_APPEARANCES = {
	pc: {
		borderClassName: 'border-l-sky-600',
		markerClassName: 'bg-sky-600',
		textClassName: 'text-sky-600',
		label: 'PCs',
		Icon: User,
	},
	opponents: {
		borderClassName: 'border-l-rose-700',
		markerClassName: 'bg-rose-700',
		textClassName: 'text-rose-700',
		label: 'Opponents',
		Icon: Bot,
	},
	allies: {
		borderClassName: 'border-l-emerald-600',
		markerClassName: 'bg-emerald-600',
		textClassName: 'text-emerald-600',
		label: 'Allies',
		Icon: User,
	},
	other: {
		borderClassName: 'border-l-violet-600',
		markerClassName: 'bg-violet-600',
		textClassName: 'text-violet-600',
		label: 'Other',
		Icon: Trees,
	},
} as const;

function getTeamAppearance(side: number, isParty: boolean): TeamAppearance {
	if (isParty) {
		return TEAM_APPEARANCES.pc;
	}

	if (side === ALIGNMENT.Opponents) {
		return TEAM_APPEARANCES.opponents;
	}

	if (side === ALIGNMENT.PCs) {
		return TEAM_APPEARANCES.allies;
	}

	return TEAM_APPEARANCES.other;
}

function getDefaultParticipantName(participant: Participant<0 | 1>): string {
	if (participant.type === 'hazard') {
		return 'Hazard';
	}

	switch (participant.side) {
		case ALIGNMENT.Opponents:
			return 'Opponent';

		case ALIGNMENT.Neutral:
			return 'Other';

		case ALIGNMENT.PCs:
			return 'PC';

		default:
			return 'Combatant';
	}
}

export const generateParticipants = (
	encounterData: Encounter | undefined,
	partyLevel: number
): InitiativeParticipant[][] => {
	if (!encounterData) return [];

	const reinforcementParticipants = (encounterData.narrativeSlots ?? [])
		.filter((slot) => slot.type === 'reinforcement')
		.flatMap((slot) => slot.participants ?? []);

	const allParticipants = [
		...encounterData.participants,
		...reinforcementParticipants,
	];

	const groupedBySide = allParticipants.reduce(
		(acc, participant) => {
			if (!acc[participant.side]) {
				acc[participant.side] = [];
			}
			acc[participant.side].push(participant);

			return acc;
		},
		{} as Record<number, Participant<0 | 1>[]>
	);

	return Object.values(groupedBySide).map((participants) =>
		participants.flatMap(({ level, name, count, ...participant }) => {
			const trimmedName = name.trim();
			const baseName =
				trimmedName.length > 0
					? trimmedName
					: getDefaultParticipantName({ level, name, count, ...participant });
			const initiativeBonus =
				typeof participant.initiativeBonus === 'number' &&
				Number.isFinite(participant.initiativeBonus)
					? participant.initiativeBonus
					: 0;
			const isSimpleHazard =
				participant.type === 'hazard' && !participant.isComplexHazard;

			return Array.from({ length: count ?? 1 }).map((_, index, { length }) => ({
				uuid: generateUUID(),
				tiePriority: PRIORITY.NPC,
				initiative: Math.floor(Math.random() * 20) + 1 + initiativeBonus,
				...participant,
				level: normalizeLevel(partyLevel, level),
				name:
					length > 1
						? `${baseName} ${indexToLetter(index).toUpperCase()}`
						: baseName,
				isSimpleHazard: isSimpleHazard,
			}));
		})
	);
};

const generateParty = (
	encounterData: Encounter | undefined,
	partyLevel: number
): InitiativeParticipant[] => {
	return Array.from({ length: encounterData?.partySize ?? 0 }).map(
		(_, index) => ({
			uuid: generateUUID(),
			tiePriority: PRIORITY.PC,
			initiative: Math.floor(Math.random() * 20) + 1,
			level: partyLevel,
			side: ALIGNMENT.PCs,
			name: `Player ${index + 1}`,
			isSimpleHazard: false,
		})
	);
};

const generatePartyFromData = (party: Party): InitiativeParticipant[] =>
	party.members.map((member) => ({
		uuid: member.uuid,
		name: member.name,
		level: member.level,
		side: ALIGNMENT.PCs,
		tiePriority: member.tiePriority ? PRIORITY.PC : PRIORITY.NPC,
		maxHealth: member.maxHealth,
		health: member.maxHealth,
		tempHealth: typeof member.maxHealth === 'number' ? 0 : undefined,
		initiative: 0,
		type: 'creature' as const,
		isSimpleHazard: false,
	}));

export type Inputs = {
	teams: {
		side: number;
		isParty: boolean;
		characters: PreviewCharacterConfig[];
	}[];
};

export const PreviewDisplay = (props: PreviewDisplayProps): JSX.Element => {
	const startEncounter = useEncounterStore((state) => state.startEncounter);
	const setTrackerMetaMap = useEncounterStore(
		(state) => state.setTrackerMetaMap
	);
	const navigate = useNavigate();

	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setView = props.setView;
	const [showInitiativeChoice, setShowInitiativeChoice] = useState(false);
	const [preparedParticipants, setPreparedParticipants] = useState<
		PreviewCharacterConfig[]
	>([]);

	const parties = useSavedPartiesStore((s) => s.parties);
	const lastUsedPartyId = useSavedPartiesStore((s) => s.lastUsedPartyId);
	const setLastUsedPartyId = useSavedPartiesStore((s) => s.setLastUsedPartyId);

	const selectedParty = useMemo(
		() => parties.find((p) => p.id === lastUsedPartyId) ?? null,
		[parties, lastUsedPartyId]
	);

	const participants = useMemo(
		() => generateParticipants(encounterData, partyLevel),
		[encounterData, partyLevel]
	);

	const party = useMemo(
		() =>
			selectedParty
				? generatePartyFromData(selectedParty)
				: generateParty(encounterData, partyLevel),
		[selectedParty, encounterData, partyLevel]
	);

	const fullParty = useMemo(
		() => [party, ...participants],
		[party, participants]
	);
	const defaultTeams = useMemo(
		() =>
			fullParty
				.filter((group) => group.length > 0)
				.map((group, index) => ({
					side: group[0].side,
					isParty: index === 0,
					characters: group.map((participant) => ({
						hasHealthData:
							typeof participant.maxHealth === 'number' ||
							typeof participant.health === 'number' ||
							typeof participant.tempHealth === 'number',
						...participant,
						initiative: participant.initiative ?? 0,
						maxHealth: participant.maxHealth ?? 1,
						tempHealth: participant.tempHealth ?? 0,
						health: participant.health ?? participant.maxHealth,
					})),
				})),
		[fullParty]
	);

	const sourceParticipantsById = useMemo(() => {
		type DefaultTeamCharacter =
			(typeof defaultTeams)[number]['characters'][number];
		const source = new Map<string, DefaultTeamCharacter>();

		for (const team of defaultTeams) {
			for (const participant of team.characters) {
				source.set(participant.uuid, participant);
			}
		}

		return source;
	}, [defaultTeams]);

	const { control, register, getFieldState, handleSubmit, reset } =
		useForm<Inputs>({
			mode: 'onChange',
			defaultValues: {
				teams: defaultTeams,
			},
		});

	useEffect(() => {
		reset({ teams: defaultTeams });
	}, [defaultTeams, reset]);

	const onStartEncounter = () => {
		handleSubmit(
			(data) => {
				const formParticipants = data.teams
					.flatMap(({ characters }) => characters)
					.map((participant) => {
						const sourceParticipant = sourceParticipantsById.get(
							participant.uuid
						);
						const mergedParticipant = {
							...sourceParticipant,
							...participant,
						};
						const hasHealthData = mergedParticipant.hasHealthData !== false;
						const maxHealth =
							typeof mergedParticipant.maxHealth === 'number' &&
							Number.isFinite(mergedParticipant.maxHealth) &&
							mergedParticipant.maxHealth >= 0
								? mergedParticipant.maxHealth
								: 1;
						const health =
							typeof mergedParticipant.health === 'number' &&
							Number.isFinite(mergedParticipant.health) &&
							mergedParticipant.health >= 0
								? mergedParticipant.health
								: maxHealth;
						const tempHealth =
							typeof mergedParticipant.tempHealth === 'number' &&
							Number.isFinite(mergedParticipant.tempHealth) &&
							mergedParticipant.tempHealth >= 0
								? mergedParticipant.tempHealth
								: 0;
						const initiative =
							typeof mergedParticipant.initiative === 'number' &&
							Number.isFinite(mergedParticipant.initiative)
								? mergedParticipant.initiative
								: (mergedParticipant.initiative ?? 0);

						if (!hasHealthData) {
							return {
								...mergedParticipant,
								hasHealthData: false,
								initiative,
								maxHealth: 1,
								health: 1,
								tempHealth: 0,
							};
						}

						return {
							...mergedParticipant,
							hasHealthData: true,
							initiative,
							maxHealth,
							health,
							tempHealth,
						};
					});
				console.log('Prepared participants for encounter:', formParticipants);
				setPreparedParticipants(formParticipants);
				setShowInitiativeChoice(true);
			},
			(errors) => {
				console.log(errors);
			}
		)();
	};

	const onSelectInitiativeView = (
		view: 'initiativeTracker' | 'initiativePlayer'
	) => {
		startEncounter(participantsToEncounterCharacters(preparedParticipants));
		setTrackerMetaMap(buildTrackerMetaMap(preparedParticipants));
		setShowInitiativeChoice(false);
		setView(view);

		if (view === 'initiativeTracker') {
			navigate({ to: '/initiative_tracker' });

			return;
		}

		if (view === 'initiativePlayer') {
			navigate({ to: '/initiative_player' });

			return;
		}

		navigate({ to: '/initiative_tracker' });
	};

	const { fields: teamFields } = useFieldArray({
		control,
		name: 'teams',
	});

	if (!encounterData) return <></>;

	return (
		<>
			<Dialog
				open={showInitiativeChoice}
				onOpenChange={setShowInitiativeChoice}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Choose Initiative View</DialogTitle>
						<DialogDescription>
							Select which initiative experience you want to use for this
							encounter.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setShowInitiativeChoice(false)}
						>
							Cancel
						</Button>
						<Button
							variant="secondary"
							onClick={() => onSelectInitiativeView('initiativeTracker')}
						>
							Initiative Tracker (PoC)
						</Button>
						<Button
							variant="secondary"
							onClick={() => onSelectInitiativeView('initiativePlayer')}
						>
							Player View (PoC)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<AppHeader setView={setView} />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<header className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
							Encounter Preview
						</p>
						<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
							{encounterData.name}
						</h1>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						{parties.length > 0 && (
							<Select
								value={selectedParty?.id ?? '__none__'}
								onValueChange={(v) =>
									setLastUsedPartyId(v === '__none__' ? undefined : v)
								}
							>
								<SelectTrigger className="h-9 min-w-44 max-w-60 text-sm">
									<SelectValue placeholder="Choose party…" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">No party (manual)</SelectItem>
									{parties.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
							{difficultyToString(
								encounterData.difficulty ?? DIFFICULTY.Moderate
							)}{' '}
							{partyLevel}
						</div>
					</div>
				</header>
				<form className="space-y-6">
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
						{teamFields.map((teamField, index) => {
							const appearance = getTeamAppearance(
								teamField.side,
								teamField.isParty
							);
							const TeamIcon = appearance.Icon;

							return (
								<PreviewCard
									register={register}
									getFieldState={getFieldState}
									borderClassName={appearance.borderClassName}
									markerClassName={appearance.markerClassName}
									key={teamField.id}
									teamIndex={index}
									sideFlag={<TeamIcon className="h-5 w-5" />}
									sideTitle={appearance.label}
									participants={teamField.characters}
									readonlyFields={
										selectedParty !== null && teamField.side === ALIGNMENT.PCs
											? ['name']
											: []
									}
								/>
							);
						})}
					</div>
					<div className="flex justify-end">
						<Button
							type="button"
							className="h-11 min-w-44 px-6 text-sm font-semibold"
							onClick={onStartEncounter}
						>
							Start Encounter
						</Button>
					</div>
				</form>
			</div>
		</>
	);
};
