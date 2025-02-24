import { UUID } from '@/utils/uuid';

export const STATE = ['normal', 'delayed', 'knocked-out'] as const;
type State = (typeof STATE)[number];

export interface Character {
	uuid: UUID;
	name: string;
	initiative: number;
	state: State;
	group: 'players' | 'enemies';
	wounded: number;
	knockedBy?: UUID;
}
