import { Encounter } from '@/store/data';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { ImportCard } from './ImportCard';
import { EncounterCard } from './EncounterCard';

type EncounterImportModalProps = {
	closeLayer: () => void;
	submit: (importedEncounter: Encounter) => void;
	showLayer: boolean;
};

export const EncounterImportModal = (props: EncounterImportModalProps) => {
	const { closeLayer, submit, showLayer } = props;
	const [importedEncounter, setImportedEncounter] = useState<Encounter | null>(
		null
	);
	const handleOpenChange = (open: boolean) => {
		if (open) {
			return;
		}

		if (importedEncounter) {
			setImportedEncounter(null);

			return;
		}

		closeLayer();
	};

	return showLayer ? (
		<Dialog open={showLayer} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
				{!importedEncounter ? (
					<ImportCard
						submit={(encounterData) => setImportedEncounter(encounterData)}
						close={closeLayer}
					/>
				) : (
					<EncounterCard
						selectedEncounter={importedEncounter}
						submit={() => {
							submit(importedEncounter);
							setImportedEncounter(null);
							closeLayer();
						}}
						close={() => setImportedEncounter(null)}
					/>
				)}
			</DialogContent>
		</Dialog>
	) : null;
};
