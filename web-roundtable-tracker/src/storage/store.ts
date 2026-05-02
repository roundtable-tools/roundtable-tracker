import { observable } from '@legendapp/state';
import {
	configureSyncedSupabase,
} from '@legendapp/state/sync-plugins/supabase';
import { generateUUID, UUID } from '@/utils/uuid';

import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb';
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import { configureSynced, syncObservable } from '@legendapp/state/sync';
enableReactTracking({
	auto: true,
	warnUnobserved: true,
});

const generateId = () => generateUUID();

configureSyncedSupabase({
	generateId,
	changesSince: 'all',
	fieldCreatedAt: 'created_at',
	fieldUpdatedAt: 'updated_at',
	// Optionally enable soft deletes
	fieldDeleted: 'deleted',
});

// Type your Store interface
export type Todo = {
	id: UUID;
	text: string | null;
	completed: boolean | null;
	created_at: string | null;
	updated_at: string | null;
	deleted: boolean | null;
};

// Supabase expects a record keyed by id, so we use an object

export const store$ = observable({
	
});

const persistOptions = configureSynced({
	persist: {
		plugin: observablePersistIndexedDB({
			databaseName: 'Legend-Local',
			version: 1,
			tableNames: ['encounterStore'],
		}),
	},
});

export const encounterStore$ = observable({
	encounter: {},
});

syncObservable(
	encounterStore$,
	persistOptions({
		persist: {
			name: 'encounterStore',
		},
	})
);
