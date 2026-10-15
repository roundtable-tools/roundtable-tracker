import { Command, STATUS } from '../common';

/**
 * Runs its parts as one step. If a part fails, the parts that already ran are
 * rolled back, so a failed composite leaves the state unchanged.
 */
export class CompositeCommand implements Command {
	readonly type = 'CompositeCommand';
	description = 'Composite Command';

	constructor(public data: { commands: Command[] }) {}

	execute() {
		const executed: Command[] = [];

		for (const command of this.data.commands) {
			if (command.execute() !== STATUS.success) {
				executed.reverse().forEach((done) => done.undo());

				return STATUS.failure;
			}
			executed.push(command);
		}

		return STATUS.success;
	}

	undo() {
		const undone: Command[] = [];

		for (const command of [...this.data.commands].reverse()) {
			if (command.undo() !== STATUS.success) {
				undone.reverse().forEach((done) => done.execute());

				return STATUS.failure;
			}
			undone.push(command);
		}

		return STATUS.success;
	}
}
