import { MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOpenPlayerView } from './useOpenPlayerView';

export const OpenPlayerViewButton = () => {
	const openPlayerView = useOpenPlayerView();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					aria-label="Open Player View"
					variant="secondary"
					size="icon"
					onClick={openPlayerView}
				>
					<MonitorPlay className="h-4 w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">Open Player View</TooltipContent>
		</Tooltip>
	);
};
