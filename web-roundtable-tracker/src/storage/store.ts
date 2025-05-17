import { observable, computed } from '@legendapp/state';
import {
	configureSyncedSupabase,
	syncedSupabase,
} from '@legendapp/state/sync-plugins/supabase';
import { generateUUID, UUID } from '@/utils/uuid';
import supabase from './supabase';

import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb';

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
const todosTable$ = observable(
	syncedSupabase({
		supabase,
		collection: 'todos',
		select: (from) =>
			from.select('id,text,completed,created_at,updated_at,deleted'),
		actions: ['read', 'create', 'update', 'delete'],
		changesSince: 'all',
		fieldCreatedAt: 'created_at',
		fieldUpdatedAt: 'updated_at',
		fieldDeleted: 'deleted',
		persist: {
			plugin: observablePersistIndexedDB({
				databaseName: 'Legend',
				version: 1,
				tableNames: ['todos'],
			}),
			name: 'todos',
		},
	})
);

// Helper to get todos as an array
function todosArray() {
	const obj = todosTable$.get();

	return Object.values(obj ?? {}) as Todo[];
}

// Create the main store observable
export const store$ = computed(() => {
	const todos = todosArray();

	return {
		todos,
		total: todos.length,
		numCompleted: todos.filter((todo) => todo.completed).length,
		addTodo: () => {
			const id = generateId(); // Use a UUID as a temporary key
			const todo = {
				id,
				text: '',
				completed: false,
				created_at: null,
				updated_at: null,
				deleted: null,
			};
			todosTable$[id].set(todo);
		},
		clearTodos: () => {
			todosTable$.set({});
		},
		updateTodo: (id: UUID, text: string) => {
			const todo = todosTable$[id].get();
			if (todo) {
				todosTable$.set({
					...todosTable$.get(),
					[id]: { ...todo, text, updated_at: new Date().toISOString() },
				});
			}
		},
		checkTodo: (id: UUID, completed: boolean) => {
			const todo = todosTable$[id].get();
			if (todo) {
				todosTable$.set({
					...todosTable$.get(),
					[id]: { ...todo, completed, updated_at: new Date().toISOString() },
				});
			}
		},
	};
});
