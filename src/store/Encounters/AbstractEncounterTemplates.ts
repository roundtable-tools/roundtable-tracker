import {
	AbstractEncounter,
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	PRIORITY,
} from '@/store/data';

const SevereBossAndLackeys: AbstractEncounter = {
	id: 'e-001',
	name: 'Boss and Lackeys',
	difficulty: DIFFICULTY.Severe,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Severe difficulty encounter for a party of four with a (+2) boss and four (-4) lackeys',
	participants: [
		{
			name: 'Boss',
			level: '+2',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
		{
			name: 'Lackey',
			level: '-4',
			side: ALIGNMENT.Opponents,
			count: 4,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Severe difficulty encounter for a party of three with a (+1) boss and three (-4) lackeys',
			participants: [
				{
					name: 'Elite Boss',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Lackey',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Severe difficulty encounter for a party of five with a (+3) boss and three (-4) lackeys',
			participants: [
				{
					name: 'Elite Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Lackey',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Severe difficulty encounter for a party of six with a (+3) boss and four (-3) lackeys',
			participants: [
				{
					name: 'Elite Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Lackey',
					level: '-3',
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const SevereBossAndLieutenant: AbstractEncounter = {
	id: 'e-002',
	name: 'Boss and Lieutenant',
	difficulty: DIFFICULTY.Severe,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Severe difficulty encounter for a party of four with a (+2) boss and their (+0) lieutenant',
	participants: [
		{
			name: 'Boss',
			level: '+2',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
		{
			name: 'Lieutenant',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Severe difficulty encounter for a party of three with a (+1) boss and their (-1) lieutenant',
			participants: [
				{
					name: 'Elite Boss',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Lieutenant',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Severe difficulty encounter for a party of five with a (+3) boss and their (-1) lieutenant',
			participants: [
				{
					name: 'Elite Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Lieutenant',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Severe difficulty encounter for a party of six with a (+3) boss and their (+1) lieutenant',
			participants: [
				{
					name: 'Elite Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Lieutenant',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const SevereWorthyOponents: AbstractEncounter = {
	id: 'e-003',
	name: 'Worthy Opponents',
	difficulty: DIFFICULTY.Severe,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Severe difficulty encounter for a party of four with three (+0) opponents',
	participants: [
		{
			name: 'Opponent',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 3,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Severe difficulty encounter for a party of three with three (-1) opponents',
			participants: [
				{
					name: 'Weak Opponent',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Severe difficulty encounter for a party of five with three (+0) opponents and a (-1) weak one',
			participants: [
				{
					name: 'Opponent',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Opponent',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Severe difficulty encounter for a party of six with three (+0) opponents and a pair of (-1) weak ones',
			participants: [
				{
					name: 'Opponent',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Opponent',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const ModerateLieutenantAndLackeys: AbstractEncounter = {
	id: 'e-004',
	name: 'Lieutenant and Lackeys',
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Moderate difficulty encounter for a party of four with a (+0) lieutenant and their four (-4) lackeys',
	participants: [
		{
			name: 'Lieutenant',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
		{
			name: 'Lackey',
			level: '-4',
			side: ALIGNMENT.Opponents,
			count: 4,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Moderate difficulty encounter for a party of three with a (+0) lieutenant and their two (-4) lackeys',
			participants: [
				{
					name: 'Lieutenant',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Lackey',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Moderate difficulty encounter for a party of five with a (+1) lieutenant and their four (-3) lackeys',
			participants: [
				{
					name: 'Elite Lieutenant',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Lackey',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Moderate difficulty encounter for a party of six with a (+1) lieutenant and their four (-3) lackeys',
			participants: [
				{
					name: 'Elite Lieutenant',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Lackey',
					level: '-3',
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const ModerateMatedPair: AbstractEncounter = {
	id: 'e-005',
	name: 'Mated Pair',
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Moderate difficulty encounter for a party of four with a pair of (+0) mated opponents',
	participants: [
		{
			name: 'Mated Opponent',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 2,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Moderate difficulty encounter for a party of three with a pair of (-1) weak mated opponents',
			participants: [
				{
					name: 'Mated Opponent',
					level: '-1',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Moderate difficulty encounter for a party of five with a (+0) mated opponent and an (+1) elite one',
			participants: [
				{
					name: 'Mated Opponent',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Mated Opponent',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Moderate difficulty encounter for a party of six with a pair of (+1) mated opponents',
			participants: [
				{
					name: 'Elite Mated Opponent',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const ModerateTroop: AbstractEncounter = {
	id: 'e-006',
	name: 'Troop',
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Moderate difficulty encounter for a party of four with a pair of (-2) leaders and their (+0) troop',
	participants: [
		{
			name: 'Troop',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
		{
			name: 'Leader',
			level: '-2',
			side: ALIGNMENT.Opponents,
			count: 2,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Moderate difficulty encounter for a party of three with a (-2) leader and their (+0) troop',
			participants: [
				{
					name: 'Troop',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Leader',
					level: '-2',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				}
			],
		},
		{
			partySize: 5,
			description:
				'Moderate difficulty encounter for a party of five with three (-2) leaders and their (+0) troop',
			participants: [
				{
					name: 'Troop',
					level: '+0',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Leader',
					level: '-2',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Moderate difficulty encounter for a party of six with three (-2) leaders and their (+1) troop',
			participants: [
				{
					name: 'Elite Troop',
					level: '+1',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Leader',
					level: '-2',
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const LowMookSquad: AbstractEncounter = {
	id: 'e-007',
	name: 'Mook Squad',
	difficulty: DIFFICULTY.Low,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Low difficulty encounter for a party of four with six (-4) mooks',
	participants: [
		{
			name: 'Mook',
			level: '-4',
			side: ALIGNMENT.Opponents,
			count: 6,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Low difficulty encounter for a party of three with four (-4) mooks',
			participants: [
				{
					name: 'Mook',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Low difficulty encounter for a party of five with two (-4) mooks and four (-3) elite mooks',
			participants: [
				{
					name: 'Mook',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Mook',
					level: '-3',
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Low difficulty encounter for a party of six with one (-4) mook and six (-3) elite mooks',
			participants: [
				{
					name: 'Mook',
					level: '-4',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Mook',
					level: '-3',
					side: ALIGNMENT.Opponents,
					count: 6,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
const ExtremeSoloBoss: AbstractEncounter = {
	id: 'e-008',
	name: 'Solo Boss',
	difficulty: DIFFICULTY.Extreme,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	description:
		'Extreme difficulty encounter for a party of four with a (+4) boss',
	participants: [
		{
			name: 'Boss',
			level: '+4',
			side: ALIGNMENT.Opponents,
			count: 1,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			partySize: 3,
			description:
				'Extreme difficulty encounter for a party of three with a (+3) boss',
			participants: [
				{
					name: 'Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 5,
			description:
				'Extreme difficulty encounter for a party of five with a (+4) boss and their army of two (-2) Troop squads',
			participants: [
				{
					name: 'Boss',
					level: '+4',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Troop',
					level: '-2',
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
		{
			partySize: 6,
			description:
				'Extreme difficulty encounter for a party of six with a duo (+3) boss and their (+3) companion',
			participants: [
				{
					name: 'Weak Boss',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Weak Boss Companion',
					level: '+3',
					side: ALIGNMENT.Opponents,
					count: 1,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};
export default [
	SevereBossAndLackeys,
	SevereBossAndLieutenant,
	SevereWorthyOponents,
	ModerateLieutenantAndLackeys,
	ModerateMatedPair,
	ModerateTroop,
	LowMookSquad,
	ExtremeSoloBoss,
];
/*
### **Severe Boss and Lackeys**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 4 (40)         | 3 (30)         |                |
| Party Level -3     |                |                | 4 (60)         |
| Party Level +2     | 1 (80)         |                |                |
| Party Level +3     |                | 1 (120)        | 1 (120)        |
### **Severe Boss and Lieutenant**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -1     |                | 1 (30)         |                |
| Party Level        | 1 (40)         |                |                |
| Party Level +1     |                |                | 1 (60)         |
| Party Level +2     | 1 (80)         |                |                |
| Party Level +3     |                | 1 (120)        | 1 (120)        |
### **Severe Elite Enemies
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -1     |                | 1 (30)         | 2 (60)         |
| Party Level        | 3 (120)        | 3 (120)        | 3 (120)        |
### **Moderate Lieutenant and Lackeys**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 4 (40)         | 4 (40)         |                |
| Party Level -3     |                |                | 4 (60)         |
| Party Level -2     |                |                |                |
| Party Level -1     |                |                |                |
| Party Level        | 1 (40)         |                |                |
| Party Level +1     |                | 1 (60)         | 1 (60)         |
## **Moderate Mated Pair**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level        | 2 (80)         | 1 (40)         |                |
| Party Level +1     |                | 1 (60)         | 2 (120)        |
## **Moderate Troop**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -2     | 2 (40)         | 3 (60)         | 3 (60)         |
| Party Level -1     |                |                |                |
| Party Level        | 1 (40)         | 1 (40)         |                |
| Party Level +1     |                |                | 1 (60)         |
## **Low Mook Squad**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 6 (60)         | 2 (20)         | 1 (10)         |
| Party Level -3     |                | 4 (60)         | 6 (90)         |
## **Extreme Solo Boss**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -2     |                | 2 (40)         |                |
| Party Level -1     |                |                |                |
| Party Level        |                |                |                |
| Party Level +1     |                |                |                |
| Party Level +2     |                |                |                |
| Party Level +3     |                |                | 2 (240)        |
| Party Level +4     | 1 (160)        | 1 (160)        |                |
*/
