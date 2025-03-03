import { DifficultyToString, Encounter } from '@/store/data';
import {
	Layer,
	Text,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	TextInput,
	Heading,
	Tag,
	Stack,
	MaskedInput,
    Box,
} from 'grommet';
import { useState } from 'react';

type EncounterDetailsModalProps = {
	closeLayer: () => void;
	selectedEncounter?: Encounter;
	submit: () => void;
};

export const EncounterDetailsModal = (props: EncounterDetailsModalProps) => {
	const { closeLayer, selectedEncounter, submit } = props;
	const [level, setLevel] = useState(
		selectedEncounter && 'level' in selectedEncounter
			? selectedEncounter.level
			: 0
	);
	return !!selectedEncounter ? (
		<Layer onEsc={closeLayer} onClickOutside={closeLayer}>
			<Card>
				<CardHeader>
					<Heading level={2}>Encounter Details</Heading>
				</CardHeader>
				<CardBody>
                    <Box flex direction='row' justify='between'>
					<Text>{selectedEncounter.name}</Text>
                    <Stack anchor="right">
						<Tag
							name={DifficultyToString(selectedEncounter.difficulty)}
							value={
								'level' in selectedEncounter ? selectedEncounter.level : '___'
							}
						/>
						{!('level' in selectedEncounter) ? (
							<MaskedInput
								size="small"
								height={'xxsmall'}
								focusIndicator={true}
								style={{ width: 45, border: 'none', lineHeight: '0', display: 'block', marginLeft: 'auto' }}
								mask={[
									{
										length: [1, 2],
										//   options: Array.from({ length: 20 }, (_, i) => i + 1),
										regexp: /^[0-9][0-9]$|^[0-9]$/,
										placeholder: 'lv',
									},
								]}
								value={level}
								onChange={(event) => {
									const level = parseInt(event.target.value);
									setLevel(Number.isNaN(level) ? 0 : level);
								}}
							/>
						) : (
							<></>
						)}
					</Stack>
                    </Box>
					<Text>{selectedEncounter.description}</Text>
					<Text>Difficulty</Text>
					
				</CardBody>
				<CardFooter>
					<Button label="Save" onClick={submit} />
				</CardFooter>
			</Card>
		</Layer>
	) : (
		<></>
	);
};

// <Text>{selectedEncounterData?.description}</Text>
// <Button
//     disabled={!selectedEncounterData}
//     icon={<Checkmark color="plain" />}
//     hoverIndicator
//     label={'Select Encounter'}
// />
