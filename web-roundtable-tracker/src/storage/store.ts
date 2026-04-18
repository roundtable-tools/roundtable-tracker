import { observable } from '@legendapp/state';
import {
	configureSyncedSupabase,
	syncedSupabase,
} from '@legendapp/state/sync-plugins/supabase';
import { generateUUID, UUID } from '@/utils/uuid';
import supabase from './supabase';

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
	todosTable: syncedSupabase({
		supabase,
		collection: 'todos',
		select: (from) =>
			from.select('id,text,completed,created_at,updated_at,deleted'),
		actions: ['read', 'create', 'update', 'delete'],
		changesSince: 'all',
		fieldCreatedAt: 'created_at',
		fieldUpdatedAt: 'updated_at',
		fieldDeleted: 'deleted',
		realtime: { schema: 'public' },
		persist: {
			plugin: observablePersistIndexedDB({
				databaseName: 'Legend',
				version: 1,
				tableNames: ['todos'],
			}),
			name: 'todos',
		},
	}),
	todos: () => Object.values(store$.todosTable.get() || {}),
	numCompleted: () => store$.todos().filter((todo) => todo.completed).length,
	total: () => store$.todos().length,
	addTodo: () => {
		const id = generateId(); // Use a UUID as a temporary key

		store$.todosTable[id].assign({
			id,
			text: '',
			completed: false,
		});
	},
	clearTodos: () => {
		store$.todosTable.set({});
	},
	updateTodo: (id: UUID, text: string) => {
		store$.todosTable[id].assign({
			text,
		});
	},
	checkTodo: (id: UUID, completed: boolean) => {
		store$.todosTable[id].assign({
			completed,
		});
	},
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
