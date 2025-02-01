import { createContext } from 'react';

export const STATUS = {
	success: 'SUCCESS',
	failure: 'FAILURE',
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

export interface Command<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	execute: () => Status;
	undo: () => Status;
	description?: string;
	data: T;
}

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
