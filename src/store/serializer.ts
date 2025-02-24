import {
	isCommandJSON,
	commandFromJSON,
	commandToJSON,
} from '@/CommandHistory/serialization';
import { type EncounterStoreJson } from './store';
import { type createJSONStorage } from 'zustand/middleware/persist';
import { isCommand } from '@/CommandHistory/common';

type Conf = NonNullable<
	Parameters<typeof createJSONStorage<EncounterStoreJson>>[1]
>;

/**
 * Configuration object for JSON serialization and deserialization.
 *
 * This configuration includes custom `reviver` and `replacer` functions
 * to handle specific object types during the JSON parsing and stringifying process.
 *
 * @property {Function} reviver - A function that transforms the parsed JSON value before returning it.
 * @property {Function} replacer - A function that transforms the value before stringifying it.
 */
export const jsonConfiguration: Conf = {
	reviver(_key, value) {
		if (value && typeof value === 'object' && isCommandJSON(value)) {
			return commandFromJSON(value);
		}

		return value;
	},
	replacer(_key, value) {
		if (isCommand(value)) {
			return commandToJSON(value);
		}

		return value;
	},
};
