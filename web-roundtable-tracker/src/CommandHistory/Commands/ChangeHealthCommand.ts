import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
	/** Positive = healing (capped at maxHealth). Negative = damage (reduces tempHealth first). */
	delta: number;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class ChangeHealthCommand implements Command {
	readonly type = 'ChangeHealthCommand';
	data: CommandData;
	description = 'Change Health';

	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		getDeps(this.deps)
			.encounterStore.getState()
			.updateCharacter(this.data.uuid, (old) => {
				this.data.oldCharacter = structuredClone(old);

				if (this.data.delta >= 0) {
					// Healing — capped at maxHealth, never increases tempHealth
					const newHealth = Math.min(old.health + this.data.delta, old.maxHealth);

					return { ...old, health: newHealth };
				}

				// Damage — absorb from tempHealth first
				const damage = -this.data.delta;
				const tempAbsorbed = Math.min(old.tempHealth, damage);
				const newTempHealth = old.tempHealth - tempAbsorbed;
				const remainingDamage = damage - tempAbsorbed;
				const newHealth = Math.max(old.health - remainingDamage, 0);

				return {
					...old,
					tempHealth: newTempHealth,
					tempHealthDescription: newTempHealth === 0 ? undefined : old.tempHealthDescription,
					health: newHealth,
				};
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
