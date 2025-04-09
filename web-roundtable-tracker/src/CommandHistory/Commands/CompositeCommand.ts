import { Command, STATUS } from '../common';

export class CompositeCommand implements Command {
	readonly type = 'CompositeCommand';
	description = 'Composite Command';

	constructor(public data: { commands: Command[] }) {}

	execute() {
		return (
			this.data.commands
				.map((command) => command.execute())
				.find((status) => status !== STATUS.success) ?? STATUS.success
		);
	}

	undo() {
		return (
			this.data.commands
				.reverse()
				.map((command) => command.undo())
				.find((status) => status !== STATUS.success) ?? STATUS.success
		);
	}
}
