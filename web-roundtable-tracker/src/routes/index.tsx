import { Button } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';
import { use$ } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';

import { FolderOpen, PencilRuler, Play } from 'lucide-react';
import { store$ } from '@/storage/store';
import type { Observable } from '@legendapp/state';
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
	// Consume the computed observables from the global store$
	const total = use$(store$.total);
	const completed = use$(store$.numCompleted);

	const onClickClear = () => store$.todos.set([]);

	return (
		<div>
			<p>Total: {total}</p>
			<p>Completed: {completed}</p>
			{store$.todos.get().map((todo, idx) => (
				<TodoItem key={todo.id} item$={store$.todos[idx]} />
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
function TodoItem({ item$ }: { item$: Observable<Todo> }) {
	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Call addTodo from the global store$
		if (e.key === 'Enter') store$.addTodo();
	};

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
			<input
				type="checkbox"
				checked={!!item$.completed.get?.()}
				onChange={(e) => item$.completed.set?.(e.target.checked)}
			/>
			<$React.input $value={item$.text} onKeyDown={onKeyDown} />
		</div>
	);
}
