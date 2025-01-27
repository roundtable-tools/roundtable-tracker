import { v4 } from 'uuid';

export type UUID = string;

export const generateUUID = (): UUID => v4();
