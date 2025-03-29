import { Layer } from 'grommet';

type EncounterLoadModalProps = {
	closeLayer: () => void;
	submit: () => void;
};

export const EncounterLoadModal = (props: EncounterLoadModalProps) => {
	const { closeLayer } = props;
	return (
		<Layer
			background={{
				opacity: 0,
			}}
			onEsc={closeLayer}
			onClickOutside={closeLayer}
		>
			<div>Encounter Load Modal</div>
		</Layer>
	);
};
