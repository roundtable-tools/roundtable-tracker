export const STATE = ['normal', 'delayed', 'knocked-out'] as const;
type State = (typeof STATE)[number];

export interface Character {
	name: string;
	initiative: number;
	state: State;
}
