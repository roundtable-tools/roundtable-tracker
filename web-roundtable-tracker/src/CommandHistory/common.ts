import { getEncounterStore } from '@/store/instance';

export const STATUS = {
	success: 'SUCCESS',
	failure: 'FAILURE',
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

export type Command<
	T extends Record<string, unknown> = Record<string, unknown>,
> = {
	readonly type: string;
	partOfTransaction?: boolean;
	description?: string;
	data: T;

	execute: () => Status;
	undo: () => Status;
};

export const isCommand = (obj: unknown): obj is Command => {
	const command = obj as Command;

	return (
		typeof command?.type === 'string' &&
		typeof command?.execute === 'function' &&
		typeof command?.undo === 'function'
	);
};

export type CommandDeps = {
	encounterStore: ReturnType<typeof getEncounterStore>;
};

export const getDeps = (deps?: CommandDeps) => {
	if (!deps) {
		return {
			encounterStore: getEncounterStore(),
		};
	}

	return deps;
};

export const undoOriginalState = <T>(original: T, deps?: CommandDeps) => {
	if (!original) {
		console.error(`Original state is not defined`);

		return STATUS.failure;
	}

	const { encounterStore } = getDeps(deps);

	encounterStore.setState(() => structuredClone(original));

	return STATUS.success;
};
