import { Encounter } from '@/store/data';
import { Layer } from 'grommet';
import { EncounterCard } from './EncounterCard'; // Import the new component

type EncounterDetailsModalProps = {
	closeLayer: () => void;
	selectedEncounter?: Encounter;
	submit: () => void;
};

export const EncounterDetailsModal = (props: EncounterDetailsModalProps) => {
	const { closeLayer, selectedEncounter, submit } = props;

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
				submit={submit}
				close={closeLayer}
			/>
		</Layer>
	) : (
		<></>
	);
};
