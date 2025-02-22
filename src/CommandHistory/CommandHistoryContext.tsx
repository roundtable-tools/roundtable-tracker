import { createContext } from 'react';
import { Command } from './common';

export interface CommandHistory {
	executeCommand: <K extends Record<string, unknown>>(
		command: Command<K>
	) => void;
	undo: () => void;
	redo: () => void;
	clearHistory: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export const CommandHistoryContext = createContext<CommandHistory>({
	executeCommand: () => {},
	undo: () => {},
	redo: () => {},
	clearHistory: () => {},
	canUndo: false,
	canRedo: false,
});
