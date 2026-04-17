import { describe, expect, it } from 'vitest';
import type { Character } from './data';
import {
	runtimeToInitiativeQueue,
	runtimeToOutOfInitiativeData,
	runtimeToPlayerInitiativeQueue,
} from './trackerMappers';
import type { TrackerParticipantMeta } from './encounterRuntimeStore';

const createCharacter = (overrides: Partial<Character>): Character => ({
	uuid: 'character',
	name: 'Character',
	initiative: 0,
	turnState: 'normal',
	hasTurn: false,
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
	...overrides,
});

const createMeta = (
	overrides: Partial<TrackerParticipantMeta>
): TrackerParticipantMeta => ({
	role: 'opponent',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	...overrides,
});

describe('trackerMappers', () => {
	it('preserves runtime initiative order instead of re-sorting by initiative', () => {
		const charactersMap = {
			bravo: createCharacter({
				uuid: 'bravo',
				name: 'Bravo',
				initiative: 10,
			}),
			alpha: createCharacter({
				uuid: 'alpha',
				name: 'Alpha',
				initiative: 20,
			}),
			delta: createCharacter({
				uuid: 'delta',
				name: 'Delta',
				initiative: 30,
				turnState: 'delayed',
			}),
		};
		const trackerMetaMap = {
			bravo: createMeta({ role: 'pc' }),
			alpha: createMeta({ role: 'opponent' }),
			delta: createMeta({ role: 'ally' }),
		};

		const queue = runtimeToInitiativeQueue({
			charactersOrder: ['bravo', 'alpha'],
			delayedOrder: ['delta'],
			charactersMap,
			trackerMetaMap,
		});

		expect(queue.map((participant) => participant.id)).toEqual([
			'bravo',
			'alpha',
			'delta',
		]);
	});

	it('maps delayed participants into out-of-initiative delayed section', () => {
		const charactersMap = {
			delayed: createCharacter({
				uuid: 'delayed',
				name: 'Delayed Character',
				turnState: 'delayed',
			}),
		};
		const trackerMetaMap = {
			delayed: createMeta({ role: 'pc' }),
		};

		const outOfInitiative = runtimeToOutOfInitiativeData({
			charactersOrder: [],
			delayedOrder: ['delayed'],
			charactersMap,
			trackerMetaMap,
			encounterData: undefined,
			partyLevel: 5,
		});

		expect(outOfInitiative.delayed).toHaveLength(1);
		expect(outOfInitiative.delayed[0].id).toBe('delayed');
		expect(outOfInitiative.delayed[0].state).toBe('delayed');
	});

	it('builds a player-safe initiative queue with coarse hp labels', () => {
		const charactersMap = {
			healthy: createCharacter({
				uuid: 'healthy',
				name: 'Healthy',
				health: 18,
				maxHealth: 20,
			}),
			wounded: createCharacter({
				uuid: 'wounded',
				name: 'Wounded',
				health: 8,
				maxHealth: 20,
				turnState: 'delayed',
			}),
			defeated: createCharacter({
				uuid: 'defeated',
				name: 'Defeated',
				health: 0,
				maxHealth: 20,
				turnState: 'knocked-out',
			}),
		};
		const trackerMetaMap = {
			healthy: createMeta({ role: 'pc' }),
			wounded: createMeta({ role: 'opponent' }),
			defeated: createMeta({ role: 'ally' }),
		};

		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: ['healthy', 'wounded', 'defeated'],
			delayedOrder: [],
			charactersMap,
			trackerMetaMap,
		});

		expect(queue).toEqual([
			{
				id: 'healthy',
				name: 'Healthy',
				status: 'Ready',
				hpLabel: 'Healthy',
			},
			{
				id: 'wounded',
				name: 'Wounded',
				status: 'Delayed',
				hpLabel: 'Wounded',
			},
			{
				id: 'defeated',
				name: 'Defeated',
				status: 'Knocked Out',
				hpLabel: 'Defeated',
			},
		]);
	});
});
