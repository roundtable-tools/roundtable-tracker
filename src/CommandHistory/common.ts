import { getEncounterStore } from '@/store/instance';

export const STATUS = {
	success: 'SUCCESS',
	failure: 'FAILURE',
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

export interface Command<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	readonly type: string;
	description?: string;
	data: T;

	execute: () => Status;
	undo: () => Status;
}

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
