import {
	ALIGNMENT,
	DIFFICULTY,
	difficultyToString,
	Encounter,
	InitiativeParticipant,
	PRIORITY,
} from '@/store/data';
import { generateUUID } from '@/utils/uuid';
import { PreviewCard } from './PreviewCard';
import {
	generateParticipants,
	generateReinforcements,
} from './generateParticipants';
import {
	generatePartyFromData,
	toPreviewCharacter,
	toStartingParticipant,
	type PreviewCharacterConfig,
} from './startingParticipants';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/AppHeader';
import {
	buildPendingReinforcements,
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from '@/store/convert';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { useOpenPlayerView } from '@/components/InitiativeTracker/useOpenPlayerView';
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
import { Bot, FolderOpen, ShieldPlus, Trees, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSavedPartiesStore } from '@/store/savedPartiesInstance';
import { splitArray } from '@/utils/array';

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
	reinforcements: {
		borderClassName: 'border-l-amber-600',
		markerClassName: 'bg-amber-600',
		textClassName: 'text-amber-600',
		label: 'Reinforcements',
		Icon: ShieldPlus,
	},
} as const;

function getTeamAppearance(
	side: number,
	isParty: boolean,
	isReinforcement: boolean
): TeamAppearance {
	if (isReinforcement) {
		return TEAM_APPEARANCES.reinforcements;
	}

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

export type Inputs = {
	teams: {
		side: number;
		isParty: boolean;
		/** Set on a reinforcement slot's team. */
		reinforcement?: { slotId: string; round: number };
		characters: PreviewCharacterConfig[];
	}[];
};

export const PreviewDisplay = (): JSX.Element => {
	const startEncounter = useEncounterStore((state) => state.startEncounter);
	const navigate = useNavigate();
	const openPlayerView = useOpenPlayerView();

	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
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

	const party = useMemo(
		() =>
			selectedParty
				? generatePartyFromData(selectedParty)
				: generateParty(encounterData, partyLevel),
		[selectedParty, encounterData, partyLevel]
	);

	// Keyed by the party's names, not the party itself, so picking another
	// party with the same names keeps the creatures and their initiative rolls
	const partyNamesKey = useMemo(
		() => JSON.stringify(party.map((member) => member.name)),
		[party]
	);

	const participants = useMemo(
		() =>
			generateParticipants(
				encounterData,
				partyLevel,
				JSON.parse(partyNamesKey) as string[]
			),
		[encounterData, partyLevel, partyNamesKey]
	);

	// Reinforcements get their initiative here too; they join at it when their
	// event is triggered.
	const reinforcements = useMemo(
		() =>
			generateReinforcements(encounterData, partyLevel, [
				...(JSON.parse(partyNamesKey) as string[]),
				...participants.flat().map((participant) => participant.name),
			]),
		[encounterData, partyLevel, partyNamesKey, participants]
	);

	const fullParty = useMemo(
		() => [party, ...participants],
		[party, participants]
	);
	const defaultTeams = useMemo(
		() => [
			...fullParty
				.filter((group) => group.length > 0)
				.map((group, index) => ({
					side: group[0].side,
					isParty: index === 0,
					characters: group.map(toPreviewCharacter),
				})),
			...reinforcements.map(({ slot, participants: slotParticipants }) => ({
				side: slotParticipants[0].side,
				isParty: false,
				reinforcement: { slotId: slot.id, round: slot.trigger.round },
				characters: slotParticipants.map((participant) => ({
					...toPreviewCharacter(participant),
					reinforcementSlotId: slot.id,
				})),
			})),
		],
		[fullParty, reinforcements]
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
		handleSubmit((data) => {
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

					return toStartingParticipant(mergedParticipant);
				});
			setPreparedParticipants(formParticipants);
			setShowInitiativeChoice(true);
		})();
	};

	const onSelectInitiativeView = (
		view: 'initiativeTracker' | 'initiativePlayer'
	) => {
		const [reinforcementParticipants, startingParticipants] = splitArray(
			preparedParticipants,
			(participant) => Boolean(participant.reinforcementSlotId)
		);

		startEncounter(
			participantsToEncounterCharacters([...startingParticipants]),
			buildTrackerMetaMap(startingParticipants),
			buildPendingReinforcements(
				startingParticipants,
				reinforcementParticipants.map((participant) => ({
					...participant,
					reinforcementSlotId: participant.reinforcementSlotId ?? '',
				})),
				encounterData?.narrativeSlots
			)
		);
		setShowInitiativeChoice(false);

		// The player view opens in its own window, so the tracker stays here.
		if (view === 'initiativePlayer') {
			openPlayerView();
		}

		navigate({ to: '/initiative_tracker' });
	};

	const { fields: teamFields } = useFieldArray({
		control,
		name: 'teams',
	});

	if (!encounterData) {
		return (
			<>
				<AppHeader />
				<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
					<FolderOpen className="h-12 w-12 text-muted-foreground" />
					<h1 className="text-2xl font-semibold tracking-tight">
						No encounter loaded
					</h1>
					<p className="text-muted-foreground">
						Pick an encounter to preview it and start initiative.
					</p>
					<Button onClick={() => navigate({ to: '/encounters' })}>
						Go to Encounters
					</Button>
				</div>
			</>
		);
	}

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
							Initiative Tracker
						</Button>
						<Button
							variant="secondary"
							onClick={() => onSelectInitiativeView('initiativePlayer')}
						>
							Tracker and Player View
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<AppHeader />
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
								teamField.isParty,
								teamField.reinforcement !== undefined
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
									sideTitle={
										teamField.reinforcement ? (
											<span className="flex flex-col gap-0.5">
												<span>{`${appearance.label} · round ${teamField.reinforcement.round}`}</span>
												<span className="text-xs font-normal">
													Join at this initiative when triggered
												</span>
											</span>
										) : (
											appearance.label
										)
									}
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
