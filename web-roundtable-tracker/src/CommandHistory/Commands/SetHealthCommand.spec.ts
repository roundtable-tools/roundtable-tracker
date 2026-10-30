import { beforeEach, describe, expect, it } from 'vitest';
import { Character } from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { STATUS } from '../common';
import { SetHealthCommand } from './SetHealthCommand';

const HERO = '00000000-0000-0000-0000-000000000001';

const character: Character = {
	uuid: HERO,
	name: 'Hero',
	initiative: 10,
	turnState: 'normal',
	health: 10,
	maxHealth: 20,
	tempHealth: 5,
	tempHealthDescription: 'False Life',
};

describe('SetHealthCommand', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		store = createEncounterStore();
		store.setState({ charactersMap: { [HERO]: character } });
	});

	const set = (health: number) =>
		new SetHealthCommand({ uuid: HERO, health }, { encounterStore: store });

	const hero = () => store.getState().charactersMap[HERO];

	it('sets HP and leaves temp HP alone, and undoes it', () => {
		const command = set(3);

		expect(command.execute()).toBe(STATUS.success);
		expect(hero()).toMatchObject({
			health: 3,
			tempHealth: 5,
			tempHealthDescription: 'False Life',
		});

		expect(command.undo()).toBe(STATUS.success);
		expect(hero()).toEqual(character);
	});

	it('fails for a participant not in the encounter, changing nothing', () => {
		const command = new SetHealthCommand(
			{ uuid: '00000000-0000-0000-0000-000000000009', health: 5 },
			{ encounterStore: store }
		);

		expect(command.execute()).toBe(STATUS.failure);
		expect(hero()).toEqual(character);
	});

	it('clamps HP to 0..max HP', () => {
		set(50).execute();
		expect(hero().health).toBe(20);

		set(-4).execute();
		expect(hero().health).toBe(0);
	});
});
