import { Command, STATUS } from '../CommandHistoryContext';

export class RandomIntCommand implements Command {
	constructor(range: number = 5) {
		this.data = {
			number: Math.floor(Math.random() * range),
		};
		this.description = 'Random Int Command';
	}
	data: { number: number };
	description?: string | undefined;
	execute() {
		console.debug(`Executing ${this.data.number}`);
		return STATUS.success;
	}
	undo() {
		console.debug(`Undoing ${this.data.number}`);
		return STATUS.success;
	}
}
