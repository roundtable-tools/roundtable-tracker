import { Button } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useOpenPlayerView } from '@/components/InitiativeTracker/useOpenPlayerView';

import {
	FolderOpen,
	MonitorPlay,
	PencilRuler,
	Play,
	Users,
} from 'lucide-react';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	const openPlayerView = useOpenPlayerView();

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<div className="flex gap-4 p-4 flex-wrap items-center justify-center">
				<Button asChild className="text-xl h-auto">
					<Link to="/initiative_tracker">
						<Play size={48} /> Continue Encounter
					</Link>
				</Button>

				<Button
					className="text-xl h-auto"
					variant="secondary"
					onClick={openPlayerView}
				>
					<MonitorPlay size={48} /> Player View
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

				<Button asChild className="text-xl h-auto" variant="secondary">
					<Link to="/party_setup">
						<Users size={48} /> Parties
					</Link>
				</Button>
			</div>
		</div>
	);
}
