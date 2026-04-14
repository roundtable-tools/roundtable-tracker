export type TrackerParticipant = {
	id: string;
	name: string;
	role: 'pc' | 'opponent' | 'neutral' | 'hazard' | 'reinforcement';
	state: 'active' | 'delayed' | 'knocked-out' | 'inactive';
	hpLabel: 'Healthy' | 'Barely Injured' | 'Bloodied' | 'Critical';
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
			hpLabel: 'Healthy',
			notes: 'Holding front line near center rune.',
		},
		{
			id: 'npc-1',
			name: 'Cinder Mage',
			role: 'opponent',
			state: 'active',
			hpLabel: 'Barely Injured',
			notes: 'Preparing ignition cone on next action.',
		},
		{
			id: 'npc-2',
			name: 'Ember Wisp B',
			role: 'opponent',
			state: 'active',
			hpLabel: 'Bloodied',
			notes: 'Orbiting western pillar.',
		},
		{
			id: 'pc-2',
			name: 'Mira the Oracle',
			role: 'pc',
			state: 'delayed',
			hpLabel: 'Critical',
			notes: 'Concentrating on protective ward.',
		},
		{
			id: 'npc-3',
			name: 'Basalt Hound',
			role: 'opponent',
			state: 'active',
			hpLabel: 'Healthy',
			notes: 'Guarding the west stair with readied movement.',
		},
		{
			id: 'pc-3',
			name: 'Seren of the Glass Bow',
			role: 'pc',
			state: 'active',
			hpLabel: 'Barely Injured',
			notes: 'Tracking weak points around the anchor rune.',
		},
		{
			id: 'neutral-1',
			name: 'Temple Attendant',
			role: 'neutral',
			state: 'active',
			hpLabel: 'Healthy',
			notes: 'Attempting to evacuate trapped acolytes.',
		},
		{
			id: 'npc-4',
			name: 'Ember Wisp C',
			role: 'opponent',
			state: 'knocked-out',
			hpLabel: 'Bloodied',
			notes: 'Dropped beside the collapsed bridge after a lucky strike.',
		},
		{
			id: 'pc-4',
			name: 'Brother Cal',
			role: 'pc',
			state: 'delayed',
			hpLabel: 'Healthy',
			notes: 'Stabilizing allies while tracking hazard timing.',
		},
	] satisfies TrackerParticipant[],
	outOfInitiative: {
		reinforcements: [
			{
				id: 'reinforce-1',
				name: 'Ashbound Brute',
				role: 'reinforcement',
				state: 'inactive',
				hpLabel: 'Healthy',
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
				hpLabel: 'Healthy',
				notes: 'Simple hazard currently dormant.',
			},
		],
	} as const,
};
