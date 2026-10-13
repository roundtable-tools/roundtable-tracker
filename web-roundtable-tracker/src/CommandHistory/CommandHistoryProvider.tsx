import { FC, ReactNode } from 'react';

import { CommandHistoryContext } from './CommandHistoryContext';
import {
	getEncounterStore,
	useEncounterStore,
} from '@/store/encounterRuntimeInstance';
import { Command, STATUS } from './common';

const commandName = (command: Command) => command.description ?? command.type;

export const CommandHistoryProvider: FC<{ children: ReactNode }> = ({
	children,
}) => {
	const redoStack = useEncounterStore((state) => state.redoStack);
	const setRedoStack = useEncounterStore((state) => state.setRedoStack);
	const history = useEncounterStore((state) => state.history);
	const setHistory = useEncounterStore((state) => state.setHistory);

	const executeCommand = (command: Command) => {
		const result = command.execute();

		if (result === 'FAILURE') {
			const result = command.undo();

			if (result === 'FAILURE') {
				throw new Error('Failed to undo command');
			}
			throw new Error('Failed to execute command');
		}

		setHistory((prev) => [...prev, command]);
		setRedoStack([]); // Clear redo stack after a new command is executed
	};

	const undo = () => {
		const lastCommand = getEncounterStore().getState().history.at(-1);

		if (!lastCommand) return;

		if (lastCommand.undo() === STATUS.failure) {
			console.error(`Failed to undo command: ${commandName(lastCommand)}`);

			return;
		}

		setHistory((prev) => prev.slice(0, -1));
		setRedoStack((prev) => [lastCommand, ...prev]);
	};

	const redo = () => {
		const nextCommand = getEncounterStore().getState().redoStack[0];

		if (!nextCommand) return;

		if (nextCommand.execute() === STATUS.failure) {
			console.error(`Failed to redo command: ${commandName(nextCommand)}`);

			return;
		}

		setRedoStack((prev) => prev.slice(1));
		setHistory((prev) => [...prev, nextCommand]);
	};

	const clearHistory = () => {
		setHistory([]);
		setRedoStack([]);
	};

	return (
		<CommandHistoryContext.Provider
			value={{
				executeCommand,
				undo,
				redo,
				clearHistory,
				canUndo: history.length > 0,
				canRedo: redoStack.length > 0,
			}}
		>
			{children}
		</CommandHistoryContext.Provider>
	);
};
