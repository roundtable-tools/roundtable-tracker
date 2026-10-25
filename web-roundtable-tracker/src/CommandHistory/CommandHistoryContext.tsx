import { createContext } from 'react';
import { Command } from './common';

export interface CommandHistory {
	executeCommand: <K extends Record<string, unknown>>(
		command: Command<K>
	) => void;
	/** Runs a command in the same undo step as the last one. */
	amendLastCommand: <K extends Record<string, unknown>>(
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
	amendLastCommand: () => {},
	undo: () => {},
	redo: () => {},
	clearHistory: () => {},
	canUndo: false,
	canRedo: false,
});
