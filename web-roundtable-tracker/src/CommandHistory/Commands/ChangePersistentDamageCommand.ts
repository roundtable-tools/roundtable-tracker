import { UUID } from '@/utils/uuid';
import { Character, PersistentDamage } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type PersistentDamageChange =
	| { kind: 'add'; damage: PersistentDamage }
	/** The damage taken this time, offered again at the next turn's end. */
	| { kind: 'set-amount'; id: string; amount: number }
	/** A recovery check ended it, or the GM cleared it. */
	| { kind: 'end'; id: string };

type CommandProps = {
	uuid: UUID;
	change: PersistentDamageChange;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

const DESCRIPTIONS: Record<PersistentDamageChange['kind'], string> = {
	add: 'Add Persistent Damage',
	'set-amount': 'Update Persistent Damage',
	end: 'End Persistent Damage',
};

export class ChangePersistentDamageCommand implements Command {
	readonly type = 'ChangePersistentDamageCommand';
	data: CommandData;
	description: string;

	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
		this.description = DESCRIPTIONS[props.change.kind];
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const { change } = this.data;
		const character = encounterStore.getState().charactersMap[this.data.uuid];
		const entries = character?.persistentDamage ?? [];

		if (
			!character ||
			(change.kind !== 'add' && !entries.some(({ id }) => id === change.id))
		) {
			return STATUS.failure;
		}

		encounterStore.getState().updateCharacter(this.data.uuid, (old) => {
			this.data.oldCharacter = structuredClone(old);

			const persistentDamage =
				change.kind === 'add'
					? [...entries, change.damage]
					: change.kind === 'set-amount'
						? entries.map((entry) =>
								entry.id === change.id
									? { ...entry, amount: change.amount }
									: entry
							)
						: entries.filter(({ id }) => id !== change.id);

			return { ...old, persistentDamage };
		});

		return STATUS.success;
	}

	undo() {
		if (!this.data.oldCharacter) return STATUS.failure;

		getDeps(this.deps)
			.encounterStore.getState()
			.updateCharacter(this.data.uuid, this.data.oldCharacter);

		return STATUS.success;
	}
}
