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
		eventRound: 1,
		auraCycle: 1,
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
		slots: [defaultSlot()],
	};
}

function threatToDifficulty(threatKey: number): number {
	if (threatKey <= 0) return DIFFICULTY.Trivial;

	if (threatKey === 1) return DIFFICULTY.Low;

	if (threatKey <= 3) return DIFFICULTY.Moderate;

	if (threatKey <= 5) return DIFFICULTY.Severe;

	return DIFFICULTY.Extreme;
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
		.filter(
			(s) =>
				s.type === 'creature' || s.type === 'reinforcement' || s.type === 'hazard'
		)
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
		.filter((s) => s.type === 'narrative' || s.type === 'aura')
		.map((s) => ({
			id: s.id,
			type: s.type === 'aura' ? ('ongoing' as const) : ('default' as const),
			description: s.description || undefined,
			trigger: {
				round: s.type === 'aura' ? s.auraCycle : s.eventRound,
				frequency: s.type === 'aura' ? s.auraCycle : undefined,
			},
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
				eventRound: 1,
				auraCycle: 1,
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
			eventRound: 1,
			auraCycle: 1,
		});
	}

	for (const ns of encounter.narrativeSlots ?? []) {
		const isAura = ns.type === 'ongoing';

		slots.push({
			id: ns.id,
			type: isAura ? 'aura' : 'narrative',
			name: '',
			description: ns.description ?? '',
			side: 'enemy',
			level: encounter.level,
			count: 1,
			maxHealth: undefined,
			successesToDisable: 1,
			adjustment: 'none',
			isSimpleHazard: false,
			reinforcementRound: 1,
			eventRound: ns.trigger.round,
			auraCycle: ns.trigger.frequency ?? ns.trigger.round,
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
		slots: slots.length > 0 ? slots : [defaultSlot()],
	};
}
