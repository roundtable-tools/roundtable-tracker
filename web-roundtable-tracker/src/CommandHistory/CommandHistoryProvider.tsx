import { FC, ReactNode } from 'react';

import { CommandHistoryContext } from './CommandHistoryContext';
import {
	getEncounterStore,
	useEncounterStore,
} from '@/store/encounterRuntimeInstance';
import { Command } from './common';
import {
	amendCommand as amendStoreCommand,
	executeCommand as executeStoreCommand,
	redoNextCommand,
	undoLastCommand,
} from './commandExecution';

export const CommandHistoryProvider: FC<{ children: ReactNode }> = ({
	children,
}) => {
	const redoStack = useEncounterStore((state) => state.redoStack);
	const setRedoStack = useEncounterStore((state) => state.setRedoStack);
	const history = useEncounterStore((state) => state.history);
	const setHistory = useEncounterStore((state) => state.setHistory);

	const executeCommand = (command: Command) =>
		executeStoreCommand(getEncounterStore(), command);
	const amendCommand = (step: Command | undefined, command: Command) =>
		amendStoreCommand(getEncounterStore(), step, command);
	const undo = () => undoLastCommand(getEncounterStore());
	const redo = () => redoNextCommand(getEncounterStore());

	const clearHistory = () => {
		setHistory([]);
		setRedoStack([]);
	};

	return (
		<CommandHistoryContext.Provider
			value={{
				executeCommand,
				amendCommand,
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
