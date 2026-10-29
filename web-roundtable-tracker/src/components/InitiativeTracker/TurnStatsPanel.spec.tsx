import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import {
	executeCommand,
	undoLastCommand,
} from '@/CommandHistory/commandExecution';
import { Character } from '@/store/data';
import {
	createEncounterStore,
	type EncounterStore,
} from '@/store/encounterRuntimeStore';
import { getRoundActionCommand } from './roundActionCommand';

const mocks = vi.hoisted(() => ({
	store: null as ReturnType<typeof createEncounterStore> | null,
}));

vi.mock('@/store/encounterRuntimeInstance', () => ({
	useEncounterStore: <T,>(selector: (state: EncounterStore) => T) =>
		selector(mocks.store!.getState()),
}));

import { TurnStatsPanel } from './TurnStatsPanel';

const SECOND = 1000;

const character = (uuid: string, name: string, initiative: number) =>
	({
		uuid,
		name,
		initiative,
		turnState: 'normal',
		health: 10,
		maxHealth: 10,
		tempHealth: 0,
	}) satisfies Character;

const render = () => renderToStaticMarkup(createElement(TurnStatsPanel));

describe('TurnStatsPanel', () => {
	const store = () => mocks.store!;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(0);
		mocks.store = createEncounterStore();
		store()
			.getState()
			.startEncounter([
				character('goblin', 'Goblin Warrior 2', 20),
				character('hero', 'Hero', 10),
			]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const endTurn = (at: number) =>
		executeCommand(
			store(),
			getRoundActionCommand(
				store().getState().charactersOrder[0],
				'end-turn',
				store().getState(),
				{ encounterStore: store() }
			),
			at
		);

	const slayGoblin = (at: number) =>
		executeCommand(
			store(),
			new RemoveCharacterCommand(
				{ uuid: 'goblin' },
				{ encounterStore: store() }
			),
			at
		);

	it('keeps the name of a slain participant, marked as removed', () => {
		endTurn(30 * SECOND);
		slayGoblin(40 * SECOND);

		const markup = render();

		expect(markup).toContain(
			'Goblin Warrior 2<span class="text-muted-foreground"> (removed)</span>'
		);
		expect(markup).not.toContain('>Removed<');
	});

	it('keeps the name of a participant slain on its own turn', () => {
		slayGoblin(30 * SECOND);

		expect(render()).toContain('Goblin Warrior 2<span');
	});

	it('shows the participant as present again after Undo of the removal', () => {
		endTurn(30 * SECOND);
		slayGoblin(40 * SECOND);
		undoLastCommand(store(), 50 * SECOND);

		const markup = render();

		expect(markup).toContain('Goblin Warrior 2</td>');
		expect(markup).not.toContain('(removed)');
	});

	it('shows the current name of a participant still in the encounter', () => {
		endTurn(30 * SECOND);
		store()
			.getState()
			.updateCharacter('goblin', (goblin) => ({
				...goblin,
				name: 'Goblin Boss',
			}));

		expect(render()).toContain('Goblin Boss</td>');
	});
});
