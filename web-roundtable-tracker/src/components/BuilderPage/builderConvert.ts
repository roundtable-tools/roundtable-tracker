import { v4 as uuidv4 } from 'uuid';
import {
	ALIGNMENT,
	ConcreteEncounter,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type NarrativeSlot,
	type Participant,
} from '@/store/data';
import type { BuilderSlot } from './builderXp';
import { computeBuilderXP } from './builderXp';
import { Threat } from '@/models/utility/threat/Threat.class';
import type { LevelAdjustment } from '@/models/utility/level/Level';
import type { EncounterTemplateData } from '@/models/encounters/encounter.types';

export interface BuilderFormValues {
	name: string;
	description: string;
	partyLevel: number;
	partySize: number;
	gmNotes: string;
	monsterNotes: string;
	playerNotes: string;
	slots: BuilderSlot[];
}

export function defaultSlot(): BuilderSlot {
	return {
		id: uuidv4(),
		type: 'creature',
		name: '',
		description: '',
		side: 'enemy',
		level: 1,
		count: 1,
		maxHealth: undefined,
		successesToDisable: 1,
		adjustment: 'none',
		isSimpleHazard: false,
		reinforcementRound: 1,
		reinforcementParticipants: [],
		eventRound: 1,
		repeatInterval: undefined,
		accomplishmentLevel: 'story',
	};
}

export function defaultFormValues(): BuilderFormValues {
	return {
		name: '',
		description: '',
		partyLevel: 1,
		partySize: 4,
		gmNotes: '',
		monsterNotes: '',
		playerNotes: '',
		slots: [],
	};
}

export function fromEncounterTemplate(
	template: EncounterTemplateData,
	variant: EncounterTemplateData['variants'][number],
	options?: {
		partyLevel?: number;
		partySize?: number;
	}
): BuilderFormValues {
	const partyLevel = options?.partyLevel ?? variant.partyLevel ?? 1;
	const partySize = options?.partySize ?? variant.partySize ?? 4;

	return {
		name: template.name,
		description: template.description,
		partyLevel,
		partySize,
		gmNotes: '',
		monsterNotes: '',
		playerNotes: '',
		slots: variant.participants.map((participant) => ({
			id: participant.id,
			type: participant.type === 'creature' ? 'creature' : 'hazard',
			name:
				participant.type === 'creature'
					? `${participant.role || 'creature'} (${participant.count})`
					: participant.id,
			description: '',
			side:
				participant.side === 0
					? 'ally'
					: participant.side === 2
						? 'neutral'
						: 'enemy',
			level: participant.relativeLevel.toLevel(partyLevel).valueOf(),
			count: participant.count,
			maxHealth: undefined,
			successesToDisable:
				participant.type === 'hazard' ? participant.successesToDisable : 1,
			adjustment: 'none',
			isSimpleHazard:
				participant.type === 'hazard' && participant.role === 'simple',
			reinforcementRound: 1,
			reinforcementParticipants: [],
			eventRound: 1,
			repeatInterval: undefined,
			accomplishmentLevel: undefined,
		})),
	};
}

function threatToDifficulty(
	threatKey: number
): ConcreteEncounter['difficulty'] {
	if (threatKey <= 0) return DIFFICULTY.Trivial;

	if (threatKey === 1) return DIFFICULTY.Low;

	if (threatKey <= 3) return DIFFICULTY.Moderate;

	if (threatKey <= 5) return DIFFICULTY.Severe;

	return DIFFICULTY.Extreme;
}

function toRelativeLevelString(level: number, partyLevel: number): `+${number}` | `-${number}` {
	const diff = Math.trunc(level - partyLevel);
	const signed = `${diff >= 0 ? '+' : ''}${diff}`;

	return signed as `+${number}` | `-${number}`;
}

function fromRelativeLevelString(relativeLevel: string, partyLevel: number): number {
	const parsed = Number(relativeLevel);

	if (!Number.isFinite(parsed)) {
		return partyLevel;
	}

	return partyLevel + parsed;
}

export function toConcreteEncounter(
	values: BuilderFormValues,
	existingId?: string
): ConcreteEncounter {
	const id = existingId ?? uuidv4();
	const xp = computeBuilderXP(values.slots, values.partyLevel);
	const threat = Threat.fromExperienceBudget(xp, values.partySize);
	const difficulty = threatToDifficulty(threat.threat);

	const participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[] = values.slots
		.filter((s) => s.type === 'creature' || s.type === 'hazard')
		.map((s) => {
			const side =
				s.side === 'ally'
					? ALIGNMENT.PCs
					: s.side === 'enemy'
						? ALIGNMENT.Opponents
						: ALIGNMENT.Neutral;

			if (s.type === 'hazard') {
				return {
					type: 'hazard' as const,
					name: s.name,
					level: s.level,
					side,
					count: s.count,
					maxHealth: s.maxHealth || undefined,
					successesToDisable: s.successesToDisable ?? 1,
					isComplexHazard: !s.isSimpleHazard,
					description: s.description || undefined,
				};
			}

			return {
				type: 'creature' as const,
				name: s.name,
				level: s.level,
				side,
				count: s.count,
				maxHealth: s.maxHealth || undefined,
				adjustment:
					s.adjustment === 'none'
						? undefined
						: (s.adjustment as LevelAdjustment),
				description: s.description || undefined,
			};
		});

	const narrativeSlots: NarrativeSlot[] = values.slots
		.filter(
			(s) => s.type === 'narrative' || s.type === 'reinforcement'
		)
		.map((s) => ({
			id: s.id,
			type:
				s.type === 'reinforcement'
						? ('reinforcement' as const)
						: s.repeatInterval
							? ('ongoing' as const)
							: ('default' as const),
			description: s.description || undefined,
			accomplishmentLevel:
				s.type === 'reinforcement' ? undefined : s.accomplishmentLevel,
			trigger: {
				round: s.type === 'reinforcement' ? s.reinforcementRound : s.eventRound,
				frequency:
					s.type === 'reinforcement' ? undefined : s.repeatInterval || undefined,
			},
			participants:
				s.type === 'reinforcement'
					? s.reinforcementParticipants.map((participant) => {
							const side =
								participant.side === 'ally'
									? ALIGNMENT.PCs
									: participant.side === 'enemy'
										? ALIGNMENT.Opponents
										: ALIGNMENT.Neutral;

							if (participant.type === 'hazard') {
								return {
									type: 'hazard' as const,
									name: participant.name,
									level: toRelativeLevelString(participant.level, values.partyLevel),
									side,
									count: participant.count,
									maxHealth: participant.maxHealth || undefined,
									successesToDisable: participant.successesToDisable,
									isComplexHazard: !participant.isSimpleHazard,
								};
							}

							return {
								type: 'creature' as const,
								name: participant.name,
								level: toRelativeLevelString(participant.level, values.partyLevel),
								side,
								count: participant.count,
								maxHealth: participant.maxHealth || undefined,
								adjustment:
									participant.adjustment !== 'none'
										? participant.adjustment
										: undefined,
							};
						})
					: undefined,
		}));

	return {
		id,
		name: values.name,
		levelRepresentation: LEVEL_REPRESENTATION.Exact,
		level: values.partyLevel,
		partySize: values.partySize,
		difficulty,
		description: values.description,
		participants,
		narrativeSlots: narrativeSlots.length > 0 ? narrativeSlots : undefined,
		notes: {
			gm: values.gmNotes || undefined,
			monster: values.monsterNotes || undefined,
			player: values.playerNotes || undefined,
		},
	};
}

export function fromConcreteEncounter(
	encounter: ConcreteEncounter
): BuilderFormValues {
	const slots: BuilderSlot[] = [];

	for (const p of encounter.participants) {
		if (p.type === 'creature') {
			slots.push({
				id: uuidv4(),
				type: 'creature',
				name: p.name,
				description: p.description ?? '',
				side:
					p.side === ALIGNMENT.PCs
						? 'ally'
						: p.side === ALIGNMENT.Opponents
							? 'enemy'
							: 'neutral',
				level: p.level,
				count: p.count ?? 1,
				maxHealth: p.maxHealth,
				successesToDisable: 1,
				adjustment: p.adjustment ?? 'none',
				isSimpleHazard: false,
				reinforcementRound: 1,
				reinforcementParticipants: [],
				eventRound: 1,
				repeatInterval: undefined,
				accomplishmentLevel: undefined,
			});
			continue;
		}

		slots.push({
			id: uuidv4(),
			type: 'hazard',
			name: p.name,
			description: p.description ?? '',
			side:
				p.side === ALIGNMENT.PCs
					? 'ally'
					: p.side === ALIGNMENT.Opponents
						? 'enemy'
						: 'neutral',
			level: p.level,
			count: p.count ?? 1,
			maxHealth: p.maxHealth,
			successesToDisable: p.successesToDisable,
			adjustment: 'none',
			isSimpleHazard: !p.isComplexHazard,
			reinforcementRound: 1,
			reinforcementParticipants: [],
			eventRound: 1,
			repeatInterval: undefined,
			accomplishmentLevel: undefined,
		});
	}

	for (const ns of encounter.narrativeSlots ?? []) {
		const isReinforcement = ns.type === 'reinforcement';

		slots.push({
			id: ns.id,
			type: isReinforcement ? 'reinforcement' : 'narrative',
			name: '',
			description: ns.description ?? '',
			side: 'enemy',
			level: encounter.level,
			count: 1,
			maxHealth: undefined,
			successesToDisable: 1,
			adjustment: 'none',
			isSimpleHazard: false,
			reinforcementRound: ns.trigger.round,
			reinforcementParticipants: isReinforcement
				? (ns.participants ?? []).map((participant) => ({
						id: uuidv4(),
						type: participant.type,
						name: participant.name,
						side:
							participant.side === ALIGNMENT.PCs
								? 'ally'
								: participant.side === ALIGNMENT.Opponents
									? 'enemy'
									: 'neutral',
						level: fromRelativeLevelString(participant.level, encounter.level),
						count: participant.count ?? 1,
						maxHealth: participant.maxHealth,
						successesToDisable:
							participant.type === 'hazard'
								? participant.successesToDisable
								: 1,
						adjustment:
							participant.type === 'creature'
								? (participant.adjustment ?? 'none')
								: 'none',
						isSimpleHazard:
							participant.type === 'hazard' ? !participant.isComplexHazard : false,
					}))
				: [],
			eventRound: ns.trigger.round,
			repeatInterval: ns.trigger.frequency,
			accomplishmentLevel: isReinforcement
				? undefined
				: (ns.accomplishmentLevel ?? 'story'),
		});
	}

	return {
		name: encounter.name,
		description: encounter.description,
		partyLevel: encounter.level,
		partySize: encounter.partySize,
		gmNotes: encounter.notes?.gm ?? '',
		monsterNotes: encounter.notes?.monster ?? '',
		playerNotes: encounter.notes?.player ?? '',
		slots,
	};
}
