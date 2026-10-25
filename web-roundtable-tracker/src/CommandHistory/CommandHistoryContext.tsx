import { createContext } from 'react';
import { Command } from './common';

export interface CommandHistory {
	executeCommand: <K extends Record<string, unknown>>(
		command: Command<K>
	) => void;
	/**
	 * Runs a command in the same undo step as `step` while that is the last
	 * one recorded, otherwise as a step of its own.
	 */
	amendCommand: <K extends Record<string, unknown>>(
		step: Command | undefined,
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
	amendCommand: () => {},
	undo: () => {},
	redo: () => {},
	clearHistory: () => {},
	canUndo: false,
	canRedo: false,
});
