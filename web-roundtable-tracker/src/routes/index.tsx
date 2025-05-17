import { Button } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';
import { use$ } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';

import { FolderOpen, PencilRuler, Play } from 'lucide-react';
import { store$ } from '@/storage/store';
import type { Todo } from '@/storage/store';

export const Route = createFileRoute('/')({
	component: Index,
	loader: () => ({
		crumb: 'Index',
	}),
});

function Index() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<div className="flex gap-4 p-4 flex-wrap items-center justify-center">
				<Button asChild className="text-xl h-auto">
					<Link to="/about">
						<Play size={48} /> Continue
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/about">
						<FolderOpen size={48} /> Encounters
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/about">
						<PencilRuler size={48} /> Create New
					</Link>
				</Button>
			</div>
			<App />
		</div>
	);
}

function App() {
	// Use computed observables directly

	const todosArray = Object.values(use$(store$.todosTable) || {});

	const total = todosArray.length;
	const completed = todosArray.filter((todo) => todo.completed).length;

	const onClickClear = () => store$.clearTodos();

	return (
		<div>
			<p>Total: {total}</p>
			<p>Completed: {completed}</p>
			{todosArray.map((todo) => (
				<TodoItem key={todo.id} todo={todo} />
			))}
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<button type="button" onClick={store$.addTodo}>
					Add
				</button>
				<button type="button" onClick={onClickClear}>
					Clear
				</button>
			</div>
		</div>
	);
}

// Receives item$ prop from the For component
function TodoItem({ todo }: { todo: Todo }) {
	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Call addTodo from the global store$
		if (e.key === 'Enter') store$.addTodo();
	};

	return (
		<div className="flex items-center gap-2">
			<$React.input
				type="checkbox"
				checked={!!todo.completed}
				onChange={(e) => store$.checkTodo(todo.id, e.target.checked)}
				className="form-checkbox h-5 w-5 text-blue-600"
			/>
			<$React.input
				$value={todo.text ?? ''}
				onKeyDown={onKeyDown}
				onChange={(e) => store$.updateTodo(todo.id, e.target.value)}
				className="border rounded px-2 py-1"
			/>
		</div>
	);
}
