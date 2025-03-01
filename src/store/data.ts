import { UUID } from '@/utils/uuid';

export const STATE = ['normal', 'delayed', 'knocked-out'] as const;
type State = (typeof STATE)[number];

export interface Character {
	uuid: UUID;
	name: string;
	initiative: number;
	turnState: State;
	group?: 'players' | 'enemies';
	wounded?: number;
	knockedBy?: UUID;
}

export const APP_MODE = {
	Empty: 0,
	Preview: 1,
	Initiative: 2,
} as const;

export type AppMode = typeof APP_MODE[keyof typeof APP_MODE];
