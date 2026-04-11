import { v5 as uuidV5 } from 'uuid';
import { ALIGNMENT, DIFFICULTY } from '@/store/data';
import type {
	CreatureRole,
	EncounterTemplateData,
	ParticipantSide,
} from '@/models/encounters/encounter.types';
import { LevelDifference } from '@/models/utility/level/LevelDifference';

const TEMPLATE_NAMESPACE = '8b3f76de-9b09-4c7f-8a4e-3144d7d5eb53';

const createStableId = (...parts: Array<string | number>) =>
	uuidV5(parts.join(':'), TEMPLATE_NAMESPACE);

type CreatureSeed = {
	tag: string;
	relativeLevel: LevelDifference;
	count?: number;
	role: CreatureRole;
	side?: ParticipantSide;
};

type VariantSeed = {
	key: string;
	partySize: number;
	description: string;
	participants: CreatureSeed[];
};

type TemplateSeed = {
	key: string;
	name: string;
	difficulty: keyof typeof DIFFICULTY;
	description: string;
	variants: VariantSeed[];
};

const creature = (
	tag: string,
	relativeLevel: number,
	count: number,
	role: CreatureRole,
	side: ParticipantSide = ALIGNMENT.Opponents
): CreatureSeed => ({
	tag,
	relativeLevel: new LevelDifference(relativeLevel),
	count,
	role,
	side,
});

const templateSeeds: TemplateSeed[] = [
	{
		key: 'e-001',
		name: 'Boss and Lackeys',
		difficulty: 'Severe',
		description:
			'Severe difficulty encounter for a party of four with a (+2) boss and four (-4) lackeys',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Severe difficulty encounter for a party of four with a (+2) boss and four (-4) lackeys',
				participants: [
					creature('Boss', 2, 1, 'boss'),
					creature('Lackey', -4, 4, 'lackey'),
				],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Severe difficulty encounter for a party of three with a (+1) boss and three (-4) lackeys',
				participants: [
					creature('Elite Boss', 1, 1, 'boss'),
					creature('Lackey', -4, 3, 'lackey'),
				],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Severe difficulty encounter for a party of five with a (+3) boss and three (-4) lackeys',
				participants: [
					creature('Elite Boss', 3, 1, 'boss'),
					creature('Lackey', -4, 3, 'lackey'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Severe difficulty encounter for a party of six with a (+3) boss and four (-3) lackeys',
				participants: [
					creature('Elite Boss', 3, 1, 'boss'),
					creature('Elite Lackey', -3, 4, 'lackey'),
				],
			},
		],
	},
	{
		key: 'e-002',
		name: 'Boss and Lieutenant',
		difficulty: 'Severe',
		description:
			'Severe difficulty encounter for a party of four with a (+2) boss and their (+0) lieutenant',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Severe difficulty encounter for a party of four with a (+2) boss and their (+0) lieutenant',
				participants: [
					creature('Boss', 2, 1, 'boss'),
					creature('Lieutenant', 0, 1, 'lieutenant'),
				],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Severe difficulty encounter for a party of three with a (+1) boss and their (-1) lieutenant',
				participants: [
					creature('Elite Boss', 1, 1, 'boss'),
					creature('Weak Lieutenant', -1, 1, 'lieutenant'),
				],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Severe difficulty encounter for a party of five with a (+3) boss and their (-1) lieutenant',
				participants: [
					creature('Elite Boss', 3, 1, 'boss'),
					creature('Weak Lieutenant', -1, 1, 'lieutenant'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Severe difficulty encounter for a party of six with a (+3) boss and their (+1) lieutenant',
				participants: [
					creature('Elite Boss', 3, 1, 'boss'),
					creature('Elite Lieutenant', 1, 1, 'lieutenant'),
				],
			},
		],
	},
	{
		key: 'e-003',
		name: 'Worthy Opponents',
		difficulty: 'Severe',
		description:
			'Severe difficulty encounter for a party of four with three (+0) opponents',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Severe difficulty encounter for a party of four with three (+0) opponents',
				participants: [creature('Opponent', 0, 3, 'opponent')],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Severe difficulty encounter for a party of three with three (-1) opponents',
				participants: [creature('Weak Opponent', -1, 3, 'opponent')],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Severe difficulty encounter for a party of five with three (+0) opponents and a (-1) weak one',
				participants: [
					creature('Opponent', 0, 3, 'opponent'),
					creature('Weak Opponent', -1, 1, 'opponent'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Severe difficulty encounter for a party of six with three (+0) opponents and a pair of (-1) weak ones',
				participants: [
					creature('Opponent', 0, 3, 'opponent'),
					creature('Weak Opponent', -1, 2, 'opponent'),
				],
			},
		],
	},
	{
		key: 'e-004',
		name: 'Lieutenant and Lackeys',
		difficulty: 'Moderate',
		description:
			'Moderate difficulty encounter for a party of four with a (+0) lieutenant and their four (-4) lackeys',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Moderate difficulty encounter for a party of four with a (+0) lieutenant and their four (-4) lackeys',
				participants: [
					creature('Lieutenant', 0, 1, 'lieutenant'),
					creature('Lackey', -4, 4, 'lackey'),
				],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Moderate difficulty encounter for a party of three with a (+0) lieutenant and their two (-4) lackeys',
				participants: [
					creature('Lieutenant', 0, 1, 'lieutenant'),
					creature('Weak Lackey', -4, 2, 'lackey'),
				],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Moderate difficulty encounter for a party of five with a (+1) lieutenant and their four (-3) lackeys',
				participants: [
					creature('Elite Lieutenant', 1, 1, 'lieutenant'),
					creature('Weak Lackey', -4, 4, 'lackey'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Moderate difficulty encounter for a party of six with a (+1) lieutenant and their four (-3) lackeys',
				participants: [
					creature('Elite Lieutenant', 1, 1, 'lieutenant'),
					creature('Elite Lackey', -3, 4, 'lackey'),
				],
			},
		],
	},
	{
		key: 'e-005',
		name: 'Mated Pair',
		difficulty: 'Moderate',
		description:
			'Moderate difficulty encounter for a party of four with a pair of (+0) mated opponents',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Moderate difficulty encounter for a party of four with a pair of (+0) mated opponents',
				participants: [creature('Mated Opponent', 0, 2, 'opponent')],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Moderate difficulty encounter for a party of three with a pair of (-1) weak mated opponents',
				participants: [creature('Mated Opponent', -1, 2, 'opponent')],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Moderate difficulty encounter for a party of five with a (+0) mated opponent and an (+1) elite one',
				participants: [
					creature('Mated Opponent', 0, 1, 'opponent'),
					creature('Elite Mated Opponent', 1, 1, 'opponent'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Moderate difficulty encounter for a party of six with a pair of (+1) mated opponents',
				participants: [creature('Elite Mated Opponent', 1, 2, 'opponent')],
			},
		],
	},
	{
		key: 'e-006',
		name: 'Troop',
		difficulty: 'Moderate',
		description:
			'Moderate difficulty encounter for a party of four with a pair of (-2) leaders and their (+0) troop',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Moderate difficulty encounter for a party of four with a pair of (-2) leaders and their (+0) troop',
				participants: [
					creature('Troop', 0, 1, 'troop'),
					creature('Leader', -2, 2, 'lieutenant'),
				],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Moderate difficulty encounter for a party of three with a (-2) leader and their (+0) troop',
				participants: [
					creature('Troop', 0, 1, 'troop'),
					creature('Leader', -2, 1, 'lieutenant'),
				],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Moderate difficulty encounter for a party of five with three (-2) leaders and their (+0) troop',
				participants: [
					creature('Troop', 0, 1, 'troop'),
					creature('Leader', -2, 3, 'lieutenant'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Moderate difficulty encounter for a party of six with three (-2) leaders and their (+1) troop',
				participants: [
					creature('Elite Troop', 1, 1, 'troop'),
					creature('Leader', -2, 3, 'lieutenant'),
				],
			},
		],
	},
	{
		key: 'e-007',
		name: 'Mook Squad',
		difficulty: 'Low',
		description:
			'Low difficulty encounter for a party of four with six (-4) mooks',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Low difficulty encounter for a party of four with six (-4) mooks',
				participants: [creature('Mook', -4, 6, 'lackey')],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Low difficulty encounter for a party of three with four (-4) mooks',
				participants: [creature('Mook', -4, 4, 'lackey')],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Low difficulty encounter for a party of five with two (-4) mooks and four (-3) elite mooks',
				participants: [
					creature('Mook', -4, 2, 'lackey'),
					creature('Elite Mook', -3, 4, 'lackey'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Low difficulty encounter for a party of six with one (-4) mook and six (-3) elite mooks',
				participants: [
					creature('Mook', -4, 1, 'lackey'),
					creature('Elite Mook', -3, 6, 'lackey'),
				],
			},
		],
	},
	{
		key: 'e-008',
		name: 'Solo Boss',
		difficulty: 'Extreme',
		description:
			'Extreme difficulty encounter for a party of four with a (+4) boss',
		variants: [
			{
				key: 'a',
				partySize: 4,
				description:
					'Extreme difficulty encounter for a party of four with a (+4) boss',
				participants: [creature('Boss', 4, 1, 'boss')],
			},
			{
				key: 'b',
				partySize: 3,
				description:
					'Extreme difficulty encounter for a party of three with a (+3) boss',
				participants: [creature('Boss', 3, 1, 'boss')],
			},
			{
				key: 'c',
				partySize: 5,
				description:
					'Extreme difficulty encounter for a party of five with a (+4) boss and their army of two (-2) Troop squads',
				participants: [
					creature('Boss', 4, 1, 'boss'),
					creature('Troop', -2, 2, 'troop'),
				],
			},
			{
				key: 'd',
				partySize: 6,
				description:
					'Extreme difficulty encounter for a party of six with a duo (+3) boss and their (+3) companion',
				participants: [
					creature('Weak Boss', 3, 1, 'boss'),
					creature('Weak Boss Companion', 3, 1, 'opponent'),
				],
			},
		],
	},
];

const encounterTemplates: EncounterTemplateData[] = templateSeeds.map(
	(templateSeed) => {
		const templateId = createStableId('template', templateSeed.key);
		const variants = templateSeed.variants.map((variantSeed) => ({
			id: createStableId('variant', templateSeed.key, variantSeed.key),
			partySize: variantSeed.partySize,
			description: variantSeed.description,
			participants: variantSeed.participants.map((participantSeed) => ({
				id: createStableId(
					'participant',
					templateSeed.key,
					variantSeed.key,
					participantSeed.tag,
					participantSeed.relativeLevel.valueOf(),
					participantSeed.count ?? 1
				),
				type: 'creature' as const,
				role: participantSeed.role,
				tag: participantSeed.tag,
				relativeLevel: participantSeed.relativeLevel,
				count: participantSeed.count ?? 1,
				side: participantSeed.side ?? ALIGNMENT.Opponents,
			})),
			events: [],
		}));

		return {
			id: templateId,
			name: templateSeed.name,
			description: templateSeed.description,
			defaultVariantId: variants[0].id,
			variants,
			tags: [templateSeed.difficulty],
		};
	}
);

export default encounterTemplates;
