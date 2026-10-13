import { createElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import { CommandHistoryProvider } from './CommandHistoryProvider';
import { CommandHistory, CommandHistoryContext } from './CommandHistoryContext';
import { Command, STATUS } from './common';

type Status = (typeof STATUS)[keyof typeof STATUS];

/** Adds one to the round; can be told to fail its next execute or undo. */
class NextRoundCommand implements Command {
	readonly type = 'NextRoundCommand';
	description = 'Next Round Command';
	data = {};
	executeStatus: Status = STATUS.success;
	undoStatus: Status = STATUS.success;

	execute() {
		if (this.executeStatus === STATUS.failure) return STATUS.failure;

		getEncounterStore().setState((state) => ({ round: state.round + 1 }));

		return STATUS.success;
	}

	undo() {
		if (this.undoStatus === STATUS.failure) return STATUS.failure;

		getEncounterStore().setState((state) => ({ round: state.round - 1 }));

		return STATUS.success;
	}
}

const renderCommandHistory = () => {
	let commandHistory: CommandHistory | undefined;
	const Capture = () => {
		commandHistory = useContext(CommandHistoryContext);

		return null;
	};

	renderToStaticMarkup(
		createElement(CommandHistoryProvider, null, createElement(Capture))
	);

	return commandHistory!;
};

const state = () => getEncounterStore().getState();

describe('CommandHistoryProvider', () => {
	let commandHistory: CommandHistory;
	let consoleError: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		getEncounterStore().setState({ round: 1, history: [], redoStack: [] });
		consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		commandHistory = renderCommandHistory();
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	describe('executeCommand', () => {
		it('runs the command, adds it to the history and clears the redo stack', () => {
			const previous = new NextRoundCommand();
			getEncounterStore().setState({ redoStack: [previous] });
			const command = new NextRoundCommand();

			commandHistory.executeCommand(command);

			expect(state().round).toBe(2);
			expect(state().history).toEqual([command]);
			expect(state().redoStack).toEqual([]);
		});

		it('leaves the history and redo stack unchanged when the command fails', () => {
			const previous = new NextRoundCommand();
			getEncounterStore().setState({ redoStack: [previous] });
			const command = new NextRoundCommand();
			command.executeStatus = STATUS.failure;

			expect(() => commandHistory.executeCommand(command)).toThrow(
				'Failed to execute command'
			);

			expect(state().history).toEqual([]);
			expect(state().redoStack).toEqual([previous]);
		});
	});

	describe('undo', () => {
		it('undoes the last command and moves it to the redo stack', () => {
			const first = new NextRoundCommand();
			const second = new NextRoundCommand();
			commandHistory.executeCommand(first);
			commandHistory.executeCommand(second);
			const historyBefore = state().history;

			commandHistory.undo();

			expect(state().round).toBe(2);
			expect(state().history).toEqual([first]);
			expect(state().redoStack).toEqual([second]);
			expect(historyBefore).toEqual([first, second]);
		});

		it('leaves both stacks and the state unchanged when the undo fails', () => {
			const command = new NextRoundCommand();
			commandHistory.executeCommand(command);
			command.undoStatus = STATUS.failure;

			commandHistory.undo();

			expect(state().round).toBe(2);
			expect(state().history).toEqual([command]);
			expect(state().redoStack).toEqual([]);
			expect(consoleError).toHaveBeenCalledWith(
				'Failed to undo command: Next Round Command'
			);
		});

		it('does nothing with an empty history', () => {
			commandHistory.undo();

			expect(state().round).toBe(1);
			expect(state().history).toEqual([]);
			expect(state().redoStack).toEqual([]);
		});
	});

	describe('redo', () => {
		it('runs the next undone command and moves it back to the history', () => {
			const first = new NextRoundCommand();
			const second = new NextRoundCommand();
			commandHistory.executeCommand(first);
			commandHistory.executeCommand(second);
			commandHistory.undo();
			commandHistory.undo();
			const redoStackBefore = state().redoStack;

			commandHistory.redo();

			expect(state().round).toBe(2);
			expect(state().history).toEqual([first]);
			expect(state().redoStack).toEqual([second]);
			expect(redoStackBefore).toEqual([first, second]);
		});

		it('leaves both stacks and the state unchanged when the redo fails', () => {
			const command = new NextRoundCommand();
			commandHistory.executeCommand(command);
			commandHistory.undo();
			command.executeStatus = STATUS.failure;

			commandHistory.redo();

			expect(state().round).toBe(1);
			expect(state().history).toEqual([]);
			expect(state().redoStack).toEqual([command]);
			expect(consoleError).toHaveBeenCalledWith(
				'Failed to redo command: Next Round Command'
			);
		});

		it('does nothing with an empty redo stack', () => {
			commandHistory.redo();

			expect(state().round).toBe(1);
			expect(state().history).toEqual([]);
			expect(state().redoStack).toEqual([]);
		});
	});
});
