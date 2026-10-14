import {
	DIFFICULTY,
	difficultyToString,
	Encounter,
	LEVEL_REPRESENTATION,
	type Participant as StoreParticipant,
	indexToLetter,
	participantsToLevelRange,
} from '@/store/data.ts';
import type { EncounterTemplateData } from '@/models/encounters/encounter.types';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import { SavedConcreteEncounter } from '@/store/savedEncounters.ts';

export type EncounterDirectoryEntry = Encounter & {
	directoryId: string;
	source: 'template' | 'saved';
	difficultyLabel: string;
	templateId?: string;
	templateVariantId?: string;
	templateVariantLabel?: string;
	templateVariantCount?: number;
	templateGroupId?: string;
};

const toRelativeLevel = (level: LevelDifference): `+${number}` | `-${number}` =>
	level.toString() as `+${number}` | `-${number}`;

const toDirectoryDifficulty = (tags?: string[]) => {
	if (!tags || tags.length === 0) {
		return DIFFICULTY.Low;
	}

	const difficultyKey = Object.keys(DIFFICULTY).find((key) =>
		tags.some((tag) => tag.toLowerCase() === key.toLowerCase())
	) as keyof typeof DIFFICULTY | undefined;

	return difficultyKey ? DIFFICULTY[difficultyKey] : DIFFICULTY.Low;
};

const toDirectoryParticipants = (
	participants: EncounterTemplateData['variants'][number]['participants']
): StoreParticipant<typeof LEVEL_REPRESENTATION.Relative>[] => {
	return participants.map((participant) => {
		const baseParticipant = {
			name: participant.tag ?? participant.role,
			level: toRelativeLevel(participant.relativeLevel),
			side: participant.side,
			count: participant.count,
		};

		if (participant.type === 'hazard') {
			return {
				...baseParticipant,
				type: 'hazard',
				successesToDisable: participant.successesToDisable,
				isComplexHazard: participant.role === 'complex',
			};
		}

		return {
			...baseParticipant,
			type: 'creature',
			adjustment: 'none',
		};
	});
};

const toTemplateEntries = (
	templates: EncounterTemplateData[],
	groupByVariant: boolean
): EncounterDirectoryEntry[] => {
	return templates.flatMap<EncounterDirectoryEntry>((template) => {
		const difficulty = toDirectoryDifficulty(template.tags);
		const defaultVariant =
			template.variants.find(
				(variant) => variant.id === template.defaultVariantId
			) ?? template.variants[0];

		if (!defaultVariant) {
			return [];
		}

		if (!groupByVariant) {
			const participants = toDirectoryParticipants(defaultVariant.participants);

			return [
				{
					id: template.id,
					directoryId: `template:${template.id}`,
					source: 'template' as const,
					templateId: template.id,
					templateVariantId: defaultVariant.id,
					templateVariantCount: template.variants.length,
					templateGroupId: template.id,
					name: template.name,
					difficultyLabel: difficultyToString(difficulty),
					level: participantsToLevelRange(participants),
					description: defaultVariant.description ?? template.description,
					difficulty,
					partySize: defaultVariant.partySize,
					participants,
					levelRepresentation: LEVEL_REPRESENTATION.Relative,
				},
			];
		}

		const nonDefaultVariants = template.variants.filter(
			(variant) => variant.id !== defaultVariant.id
		);
		const orderedVariants = [defaultVariant, ...nonDefaultVariants];

		return orderedVariants.map((variant, index) => {
			const variantLabel = indexToLetter(index).toUpperCase();
			const id = `${template.id}-${variantLabel.toLowerCase()}`;
			const participants = toDirectoryParticipants(variant.participants);

			return {
				id,
				directoryId: `template:${id}`,
				source: 'template' as const,
				templateId: template.id,
				templateVariantId: variant.id,
				templateVariantLabel: variantLabel,
				templateVariantCount: orderedVariants.length,
				templateGroupId: template.id,
				name: template.name,
				difficultyLabel: difficultyToString(difficulty),
				level: participantsToLevelRange(participants),
				description: variant.description ?? template.description,
				difficulty,
				partySize: variant.partySize,
				participants,
				levelRepresentation: LEVEL_REPRESENTATION.Relative,
			};
		});
	});
};

const toSavedEntries = (
	savedEncounters: SavedConcreteEncounter[]
): EncounterDirectoryEntry[] => {
	return savedEncounters.map((encounter) => ({
		...encounter,
		directoryId: `saved:${encounter.id}`,
		source: 'saved',
		difficultyLabel: difficultyToString(encounter.difficulty ?? DIFFICULTY.Low),
	}));
};

export const getDefaultShowTemplates = (savedCount: number) => savedCount === 0;

export const createDirectoryEntries = (
	templates: EncounterTemplateData[],
	savedEncounters: SavedConcreteEncounter[],
	showTemplates: boolean,
	groupByVariant = true
): EncounterDirectoryEntry[] => {
	const savedEntries = toSavedEntries(savedEncounters);
	const templateEntries = showTemplates
		? toTemplateEntries(templates, groupByVariant)
		: [];

	return [...savedEntries, ...templateEntries];
};

export const toEncounter = (entry: EncounterDirectoryEntry): Encounter => {
	const { directoryId, source, ...encounter } = entry;

	return encounter;
};
