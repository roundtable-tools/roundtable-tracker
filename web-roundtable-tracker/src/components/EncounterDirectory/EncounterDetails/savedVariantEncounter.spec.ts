import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type EncounterTemplate,
	type NarrativeSlot,
} from '@/store/data';
import { validateImportedEncounter } from './importEncounter';
import {
	buildSavedVariantEncounter,
	type SavedVariant,
} from './savedVariantEncounter';

const baseSlot: NarrativeSlot = {
	id: 'slot-1',
	type: 'default',
	description: 'The bridge starts to burn',
	trigger: { round: 2 },
};

const baseEncounter: EncounterTemplate = {
	id: 'saved-relative',
	name: 'Burning Bridge',
	description: 'Bandits hold a bridge',
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	participants: [
		{
			type: 'creature',
			name: 'Bandit',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 2,
		},
	],
	narrativeSlots: [baseSlot],
	notes: { gm: 'The bandits surrender at half HP' },
};

const variantParticipants: SavedVariant['participants'] = [
	{
		type: 'creature',
		name: 'Bandit',
		level: '+1',
		side: ALIGNMENT.Opponents,
		count: 3,
	},
];

function templateParticipant(suffix: string) {
	return {
		id: `1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b0${suffix}`,
		type: 'creature',
		role: 'boss',
		count: 1,
		relativeLevel: 0,
		side: ALIGNMENT.Opponents,
	};
}

describe('buildSavedVariantEncounter', () => {
	it('keeps base events and notes when a relative variant has none', () => {
		const encounter = buildSavedVariantEncounter(baseEncounter, {
			partySize: 5,
			participants: variantParticipants,
		});

		expect(encounter).toMatchObject({
			partySize: 5,
			participants: variantParticipants,
			narrativeSlots: [baseSlot],
			notes: { gm: 'The bandits surrender at half HP' },
		});
	});

	it('uses the events and notes a relative variant sets', () => {
		const encounter = buildSavedVariantEncounter(baseEncounter, {
			participants: variantParticipants,
			narrativeSlots: [],
			notes: { gm: 'Reinforcements never come' },
		});

		expect(encounter.narrativeSlots).toEqual([]);
		expect(encounter.notes).toEqual({ gm: 'Reinforcements never come' });
	});

	it('does not give an imported variant without notes the default notes', () => {
		const [imported] = validateImportedEncounter(
			JSON.stringify({
				id: '0d3c1f7e-7f0a-4c55-9f43-2a4f1d0b9a10',
				name: 'Two Rooms',
				description: 'A template with two variants',
				defaultVariantId: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b21',
				variants: [
					{
						id: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b21',
						partySize: 4,
						notes: 'Only the default variant has notes',
						participants: [templateParticipant('1')],
						events: [],
					},
					{
						id: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b22',
						partySize: 3,
						participants: [templateParticipant('2')],
						events: [],
					},
				],
			})
		);
		const template = imported as EncounterTemplate;
		const secondVariant = template.variants?.[1] as SavedVariant;

		expect(template.notes).toEqual({
			gm: 'Only the default variant has notes',
		});
		expect(buildSavedVariantEncounter(template, secondVariant).notes?.gm).toBe(
			undefined
		);
	});
});
