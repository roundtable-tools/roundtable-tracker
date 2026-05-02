import { Button } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';

import { FolderOpen, LayoutDashboard, PencilRuler, Play, Users } from 'lucide-react';

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
					<Link to="/initiative_tracker">
						<Play size={48} /> Continue
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/initiative_tracker">
						<LayoutDashboard size={48} /> Tracker PoC
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/initiative_player">
						<Users size={48} /> Player PoC
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/encounters">
						<FolderOpen size={48} /> Encounters
					</Link>
				</Button>

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/builder">
						<PencilRuler size={48} /> Create New
					</Link>
				</Button>
			</div>
		</div>
	);
}