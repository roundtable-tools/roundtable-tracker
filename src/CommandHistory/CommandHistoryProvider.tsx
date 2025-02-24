import { FC, ReactNode } from 'react';

import { CommandHistoryContext } from './CommandHistoryContext';
import { useEncounterStore } from '@/store/instance';
import { Command } from './common';

export const CommandHistoryProvider: FC<{ children: ReactNode }> = ({
	children,
}) => {
	const redoStack = useEncounterStore((state) => state.redoStack);
	const setRedoStack = useEncounterStore((state) => state.setRedoStack);
	const history = useEncounterStore((state) => state.history);
	const setHistory = useEncounterStore((state) => state.setHistory);

	const executeCommand = (command: Command) => {
		command.execute();
		setHistory((prev) => [...prev, command]);
		setRedoStack([]); // Clear redo stack after a new command is executed
	};

	const undo = () => {
		setHistory((prev) => {
			const lastCommand = prev.pop();
			if (lastCommand) {
				lastCommand.undo();
				setRedoStack((redo) => [lastCommand, ...redo]);
			}
			return [...prev];
		});
	};

	const redo = () => {
		setRedoStack((prev) => {
			const lastCommand = prev.shift();
			if (lastCommand) {
				lastCommand.execute();
				setHistory((history) => [...history, lastCommand]);
			}
			return [...prev];
		});
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
