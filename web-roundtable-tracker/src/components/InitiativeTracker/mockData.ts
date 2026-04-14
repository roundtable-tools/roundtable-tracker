export type TrackerParticipant = {
	id: string;
	name: string;
	role: 'pc' | 'opponent' | 'neutral' | 'ally' | 'hazard' | 'reinforcement';
	state: 'active' | 'delayed' | 'knocked-out' | 'inactive';
	currentHp?: number;
	maxHp?: number;
	disableChecksSucceeded?: number;
	disableChecksRequired?: number;
	notes: string;
};

export type TimelineEvent = {
	round: number;
	title: string;
	detail: string;
};

export const trackerMockData = {
	encounterTitle: 'Cradle of Ashes',
	threatLevel: 'Severe 7',
	currentRound: 2,
	turnTimers: {
		lastTurn: '00:42',
		currentTurn: '00:17',
	},
	description:
		'The ritual chamber is collapsing as magma pressure builds. The party must survive six rounds while disrupting anchor runes.',
	narrativeDetails: [
		'At round 2, unstable vents open near the eastern balcony.',
		'At round 4, smoke density imposes reduced visibility in the center lane.',
		'At round 6, the chamber fractures and the ritual ends regardless of status.',
	],
	historyPreview: [
		'Round 1: Cinder Mage delayed to react to party movement.',
		'Round 1: Shieldbearer used Raise Shield.',
		'Round 1: Ember Wisp A knocked out.',
	],
	timeline: [
		{ round: 1, title: 'Encounter Start', detail: 'Ritual channel stabilizes.' },
		{ round: 2, title: 'Vent Burst', detail: 'Environmental hazard is introduced.' },
		{ round: 4, title: 'Smoke Wall', detail: 'Narrative visibility penalty begins.' },
		{ round: 6, title: 'Collapse', detail: 'Encounter fail state timer triggers.' },
	] satisfies TimelineEvent[],
	initiativeParticipants: [
		{
			id: 'pc-1',
			name: 'Alyx the Shieldbearer',
			role: 'pc',
			state: 'active',
			currentHp: 44,
			maxHp: 44,
			notes: 'Holding front line near center rune.',
		},
		{
			id: 'npc-1',
			name: 'Cinder Mage',
			role: 'opponent',
			state: 'active',
			currentHp: 26,
			maxHp: 30,
			notes: 'Preparing ignition cone on next action.',
		},
		{
			id: 'npc-2',
			name: 'Ember Wisp B',
			role: 'opponent',
			state: 'active',
			currentHp: 12,
			maxHp: 20,
			notes: 'Orbiting western pillar.',
		},
		{
			id: 'pc-2',
			name: 'Mira the Oracle',
			role: 'pc',
			state: 'delayed',
			currentHp: 6,
			maxHp: 24,
			notes: 'Concentrating on protective ward.',
		},
		{
			id: 'npc-3',
			name: 'Basalt Hound',
			role: 'opponent',
			state: 'active',
			currentHp: 36,
			maxHp: 38,
			notes: 'Guarding the west stair with readied movement.',
		},
		{
			id: 'pc-3',
			name: 'Seren of the Glass Bow',
			role: 'pc',
			state: 'active',
			currentHp: 21,
			maxHp: 24,
			notes: 'Tracking weak points around the anchor rune.',
		},
		{
			id: 'neutral-1',
			name: 'Temple Attendant',
			role: 'neutral',
			state: 'active',
			currentHp: 12,
			maxHp: 12,
			notes: 'Attempting to evacuate trapped acolytes.',
		},
		{
			id: 'ally-1',
			name: 'Rowan, Verdant Spear',
			role: 'ally',
			state: 'active',
			currentHp: 30,
			maxHp: 32,
			notes: 'Allied lancer pinning wisps away from the party flank.',
		},
		{
			id: 'ally-2',
			name: 'Sister Vey, Field Medic',
			role: 'ally',
			state: 'delayed',
			currentHp: 17,
			maxHp: 20,
			notes: 'Holding action for triage timing after incoming hazard pulse.',
		},
		{
			id: 'hazard-complex-1',
			name: 'Runic Counterpulse (Complex Hazard)',
			role: 'hazard',
			state: 'active',
			disableChecksSucceeded: 2,
			disableChecksRequired: 5,
			notes: 'Takes initiative turns to emit chained arc bursts along rune lines.',
		},
		{
			id: 'npc-4',
			name: 'Ember Wisp C',
			role: 'opponent',
			state: 'knocked-out',
			currentHp: 0,
			maxHp: 20,
			notes: 'Dropped beside the collapsed bridge after a lucky strike.',
		},
		{
			id: 'pc-4',
			name: 'Brother Cal',
			role: 'pc',
			state: 'delayed',
			currentHp: 27,
			maxHp: 30,
			notes: 'Stabilizing allies while tracking hazard timing.',
		},
		{
			id: 'hazard-complex-2',
			name: 'Molten Glyph Surge (Complex Hazard)',
			role: 'hazard',
			state: 'active',
			disableChecksSucceeded: 1,
			disableChecksRequired: 4,
			notes: 'Acts on initiative to retarget unstable lava vents each turn.',
		},
	] satisfies TrackerParticipant[],
	outOfInitiative: {
		reinforcements: [
			{
				id: 'reinforce-1',
				name: 'Ashbound Brute',
				role: 'reinforcement',
				state: 'inactive',
				currentHp: 40,
				maxHp: 40,
				notes: 'Arrives at round 3 from north gate.',
			},
		],
		delayed: [] as TrackerParticipant[],
		hazards: [
			{
				id: 'hazard-1',
				name: 'Magma Vent',
				role: 'hazard',
				state: 'inactive',
				disableChecksSucceeded: 0,
				disableChecksRequired: 3,
				notes: 'Simple hazard currently dormant.',
			},
			{
				id: 'hazard-2',
				name: 'Falling Debris Field',
				role: 'hazard',
				state: 'inactive',
				disableChecksSucceeded: 1,
				disableChecksRequired: 2,
				notes: 'Simple hazard: each turn, random lane becomes difficult terrain.',
			},
			{
				id: 'hazard-3',
				name: 'Searing Steam Pocket',
				role: 'hazard',
				state: 'inactive',
				disableChecksSucceeded: 2,
				disableChecksRequired: 5,
				notes: 'Simple hazard: bursts when a creature ends turn adjacent.',
			},
		],
	} as const,
};
