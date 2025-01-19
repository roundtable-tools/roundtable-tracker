import { Button, Layer } from 'grommet';

type EncounterDirectoryProps = {
	setShow: (value: boolean) => void;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const { setShow } = props;
	return (
		<Layer onEsc={() => setShow(false)} onClickOutside={() => setShow(false)}>
			<Button label="close" onClick={() => setShow(false)} />
			Tutaj damy listę przykładowych encounterów a w później opcję ładowania z
			buildera lub otworzenia buildera w popupie
		</Layer>
	);
};
