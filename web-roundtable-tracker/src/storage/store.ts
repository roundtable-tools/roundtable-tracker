import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

// Type your Store interface
export type Todo = {
	id: number;
	text: string;
	completed?: boolean;
};

interface Store {
	todos: Todo[];
	total: number;
	numCompleted: number;
	addTodo: () => void;
}

// Create a global observable for the Todos
let nextId = 0;
export const store$ = observable<Store>({
	todos: [],
	// Computeds
	total: (): number => {
		return store$.todos.length;
	},
	numCompleted: (): number => {
		return store$.todos.get().filter((todo) => todo.completed).length;
	},
	addTodo: () => {
		const todo: Todo = {
			id: nextId++,
			text: '',
		};
		store$.todos.push(todo);
	},
});

// Persist the observable to the named key of the global persist plugin
syncObservable(store$, {
	persist: {
		name: 'gettingStarted',
		plugin: ObservablePersistLocalStorage,
	},
});
