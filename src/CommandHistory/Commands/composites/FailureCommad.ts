import { Command, STATUS } from '@/CommandHistory/common';

export const getFailureCommand = (message: string) => {
	const command: Command = {
		type: 'FailureCommand',
		data: {
			message,
		},
		description: 'Failure Command',
		execute() {
			console.error(this.data.message);

			return STATUS.failure;
		},
		undo() {
			return STATUS.success;
		},
	};

	return command;
};
