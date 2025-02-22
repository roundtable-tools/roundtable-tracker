import {
	isCommandJSON,
	commandFromJSON,
	commandToJSON,
} from '@/CommandHistory/serialization';
import { EncounterStore, type EncounterStoreJson } from './store';
import { type createJSONStorage } from 'zustand/middleware/persist';

type Conf = Parameters<typeof createJSONStorage<EncounterStoreJson>>[1];

export const jsonConfiguration: Conf = {
	reviver(_key, value) {
		if (value && typeof value === 'object' && isCommandJSON(value)) {
			return commandFromJSON(value);
		}

		return value;
	},
	replacer(key, value) {
		if (key == 'history' || key == 'redoStack') {
			const commands = value as EncounterStore[typeof key];
			return commands.map(commandToJSON);
		}

		return value;
	},
};
