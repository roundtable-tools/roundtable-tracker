import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	return (
		<h1 className="text-3xl font-bold underline text-amber-300">
			Hello world!
		</h1>
	);
}
