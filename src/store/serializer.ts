import {
	isCommandJSON,
	commandFromJSON,
	commandToJSON,
} from '@/CommandHistory/serialization';
import { type EncounterStoreJson } from './store';
import { type createJSONStorage } from 'zustand/middleware/persist';
import { isCommand } from '@/CommandHistory/common';

const setToJSON = (set: Set<unknown>) => ({
	type: 'Set',
	data: Array.from(set),
});

const isSetJSON = (value: object): value is { type: 'Set'; data: unknown[] } =>
	'type' in value && value.type === 'Set';

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
	//@ts-expect-error: context parameter is not typed
	reviver(key, value, context) {
		try {
			if (value && typeof value === 'object')
				switch (true) {
					case isCommandJSON(value):
						return commandFromJSON(value);

					case isSetJSON(value):
						return new Set(value.data);
				}
		} catch (e) {
			console.log('context', context);
			console.log('key', key);
			console.log('value', value);
			throw e;
		}

		return value;
	},
	replacer(_key, value) {
		if (isCommand(value)) {
			return commandToJSON(value);
		} else if (value instanceof Set) {
			return setToJSON(value);
		}

		return value;
	},
};
