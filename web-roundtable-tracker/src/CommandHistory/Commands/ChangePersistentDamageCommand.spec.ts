import { beforeEach, describe, expect, it } from 'vitest';
import { Character, PersistentDamage } from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { STATUS } from '../common';
import { ChangePersistentDamageCommand } from './ChangePersistentDamageCommand';

const HERO = '00000000-0000-0000-0000-000000000001';

const bleed: PersistentDamage = { id: 'bleed', amount: 3, icon: 'bleed' };
const fire: PersistentDamage = {
	id: 'fire',
	name: '2d6 fire',
	amount: 7,
	icon: 'fire',
};

const character: Character = {
	uuid: HERO,
	name: 'Hero',
	initiative: 10,
	turnState: 'normal',
	health: 10,
	maxHealth: 20,
	tempHealth: 0,
	persistentDamage: [bleed],
};

describe('ChangePersistentDamageCommand', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		store = createEncounterStore();
		store.setState({ charactersMap: { [HERO]: character } });
	});

	const change = (
		props: ConstructorParameters<typeof ChangePersistentDamageCommand>[0]
	) => new ChangePersistentDamageCommand(props, { encounterStore: store });

	const hero = () => store.getState().charactersMap[HERO];

	it('adds an entry after the others, and undoes it', () => {
		const command = change({
			uuid: HERO,
			change: { kind: 'add', damage: fire },
		});

		expect(command.description).toBe('Add Persistent Damage');
		expect(command.execute()).toBe(STATUS.success);
		expect(hero().persistentDamage).toEqual([bleed, fire]);

		expect(command.undo()).toBe(STATUS.success);
		expect(hero()).toEqual(character);
	});

	it('keeps the damage last taken', () => {
		change({
			uuid: HERO,
			change: { kind: 'set-amount', id: 'bleed', amount: 5 },
		}).execute();

		expect(hero().persistentDamage).toEqual([{ ...bleed, amount: 5 }]);
	});

	it('ends an entry, and undoes it', () => {
		const command = change({
			uuid: HERO,
			change: { kind: 'end', id: 'bleed' },
		});

		expect(command.execute()).toBe(STATUS.success);
		expect(hero().persistentDamage).toEqual([]);

		command.undo();
		expect(hero()).toEqual(character);
	});

	it('fails for an entry or participant not in the encounter, changing nothing', () => {
		expect(
			change({ uuid: HERO, change: { kind: 'end', id: 'acid' } }).execute()
		).toBe(STATUS.failure);
		expect(
			change({
				uuid: HERO,
				change: { kind: 'set-amount', id: 'acid', amount: 5 },
			}).execute()
		).toBe(STATUS.failure);
		expect(
			change({
				uuid: '00000000-0000-0000-0000-000000000009',
				change: { kind: 'add', damage: fire },
			}).execute()
		).toBe(STATUS.failure);
		expect(hero()).toEqual(character);
	});
});
