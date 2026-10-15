import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type Encounter,
} from '@/store/data';

type CardProps = {
	submit: (encounter?: Encounter) => void;
};

const mocks = vi.hoisted(() => ({
	cardProps: undefined as CardProps | undefined,
	importedEncounter: undefined as unknown,
}));

// Start the modal with an encounter already imported, so it shows the card
vi.mock('react', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react')>();

	return {
		...actual,
		// The imported encounter is the only state that starts as null
		useState: (initial: unknown) =>
			actual.useState(initial === null ? mocks.importedEncounter : initial),
	};
});

vi.mock('@/components/ui/dialog', () => ({
	Dialog: ({ children }: { children: ReactNode }) => children,
	DialogContent: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./ImportCard', () => ({ ImportCard: () => null }));

vi.mock('./EncounterCard', () => ({
	EncounterCard: (props: CardProps) => {
		mocks.cardProps = props;

		return null;
	},
}));

import { EncounterImportModal } from './EncounterImportModal';

const importedEncounter: Encounter = {
	id: 'imported-encounter',
	name: 'Imported Encounter',
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 2,
	partySize: 4,
	difficulty: DIFFICULTY.Moderate,
	description: 'Imported encounter description',
	participants: [
		{
			type: 'creature',
			name: 'Ogre',
			level: 2,
			side: ALIGNMENT.Opponents,
			count: 1,
		},
	],
};

function renderWithImportedEncounter() {
	const submit = vi.fn();

	mocks.importedEncounter = importedEncounter;
	renderToStaticMarkup(
		createElement(EncounterImportModal, {
			closeLayer: vi.fn(),
			submit,
			showLayer: true,
		})
	);

	return { submit, cardProps: mocks.cardProps as CardProps };
}

describe('EncounterImportModal', () => {
	beforeEach(() => {
		mocks.cardProps = undefined;
	});

	it('submits the variant selected in the preview', () => {
		const { submit, cardProps } = renderWithImportedEncounter();
		const variantEncounter: Encounter = { ...importedEncounter, partySize: 5 };

		cardProps.submit(variantEncounter);

		expect(submit).toHaveBeenCalledWith(variantEncounter);
	});

	it('submits the imported encounter when no variant is selected', () => {
		const { submit, cardProps } = renderWithImportedEncounter();

		cardProps.submit();

		expect(submit).toHaveBeenCalledWith(importedEncounter);
	});
});
