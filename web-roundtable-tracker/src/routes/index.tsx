import { Button } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';

import { FolderOpen, PencilRuler, Play } from 'lucide-react';

export const Route = createFileRoute('/')({
	component: Index,
	loader: () => ({
		crumb: 'Index',
	}),
});

function Index() {
	return (
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
	);
}
