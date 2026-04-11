import { Encounter } from '@/store/data';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EncounterCard } from './EncounterCard';

type EncounterDetailsModalProps = {
	closeLayer: () => void;
	selectedEncounter?: Encounter;
	source?: 'template' | 'saved';
	encounterId?: string;
	onDelete?: () => void;
	submit: () => void;
};

export const EncounterDetailsModal = (props: EncounterDetailsModalProps) => {
	const { closeLayer, selectedEncounter, source, encounterId, onDelete, submit } =
		props;

	return selectedEncounter ? (
		<Dialog open={Boolean(selectedEncounter)} onOpenChange={(open) => !open && closeLayer()}>
			<DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<EncounterCard
					selectedEncounter={selectedEncounter}
					source={source}
					encounterId={encounterId}
					onDelete={onDelete}
					submit={submit}
					close={closeLayer}
				/>
			</DialogContent>
		</Dialog>
	) : (
		null
	);
};
