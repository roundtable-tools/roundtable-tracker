import { Command, STATUS } from '../CommandHistoryContext';

export class RandomIntCommand implements Command {
	constructor(range: number = 5) {
		this.data = {
			number: (Math.random() * range) | 0,
		};
		this.description = 'Random Int Command';
	}
	data: { number: number };
	description?: string | undefined;
	execute() {
		console.log(`Executing ${this.data.number}`);
		return STATUS.success;
	}
	undo() {
		console.log(`Undoing ${this.data.number}`);
		return STATUS.success;
	}
}
