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
	const [importWarnings, setImportWarnings] = useState<string[]>([]);
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
						submit={(encounterData, warnings) => {
							setImportedEncounter(encounterData);
							setImportWarnings(warnings);
						}}
						close={closeLayer}
					/>
				) : (
					<>
						{importWarnings.length > 0 ? (
							<div
								role="alert"
								className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-800 dark:text-amber-200"
							>
								<p className="font-medium">
									Some imported data could not be stored:
								</p>
								<ul className="mt-1 list-disc pl-5">
									{importWarnings.map((warning) => (
										<li key={warning}>{warning}</li>
									))}
								</ul>
							</div>
						) : null}
						<EncounterCard
							selectedEncounter={importedEncounter}
							submit={() => {
								submit(importedEncounter);
								setImportedEncounter(null);
								closeLayer();
							}}
							close={() => setImportedEncounter(null)}
						/>
					</>
				)}
			</DialogContent>
		</Dialog>
	) : null;
};
