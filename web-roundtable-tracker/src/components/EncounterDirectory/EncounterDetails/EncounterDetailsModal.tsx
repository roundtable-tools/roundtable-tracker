import { Encounter } from '@/store/data';
import { Layer } from 'grommet';
import { EncounterCard } from './EncounterCard'; // Import the new component

type EncounterDetailsModalProps = {
	closeLayer: () => void;
	selectedEncounter?: Encounter;
	source?: 'template' | 'saved';
	encounterId?: string;
	submit: () => void;
};

export const EncounterDetailsModal = (props: EncounterDetailsModalProps) => {
	const { closeLayer, selectedEncounter, source, encounterId, submit } = props;

	return selectedEncounter ? (
		<Layer
			background={{
				opacity: 0,
			}}
			onEsc={closeLayer}
			onClickOutside={closeLayer}
		>
			<EncounterCard
				selectedEncounter={selectedEncounter}
				source={source}
				encounterId={encounterId}
				submit={submit}
				close={closeLayer}
			/>
		</Layer>
	) : (
		<></>
	);
};
