import { difficultyToString, Encounter } from '@/store/data';
import { useEncounterStore } from '@/store/instance';
import {
	Layer,
	Text,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Heading,
	Tag,
	Stack,
	MaskedInput,
	Box,
} from 'grommet';
import { useEffect, useState } from 'react';

type EncounterDetailsModalProps = {
	closeLayer: () => void;
	selectedEncounter?: Encounter;
	submit: () => void;
};

export const EncounterDetailsModal = (props: EncounterDetailsModalProps) => {
	const { closeLayer, selectedEncounter, submit } = props;
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setPartyLevel = useEncounterStore((state) => state.setPartyLevel);
	const [level, setLevel] = useState<number>(partyLevel);
	useEffect(() => {
		setLevel(
			(selectedEncounter && 'level' in selectedEncounter)
				? Array.isArray(selectedEncounter.level)
					? Math.min(selectedEncounter.level[1], Math.max(selectedEncounter.level[0], partyLevel))
					: selectedEncounter.level as number
				: 0
		);
	}, [selectedEncounter]);
	return !!selectedEncounter ? (
		<Layer
			background={{
				opacity: 0,
			}}
			onEsc={closeLayer}
			onClickOutside={closeLayer}
		>
			<Card>
				<CardHeader pad="small" background="brand">
					<Box flex direction="row" justify="between">
						<Heading level={3}>{selectedEncounter.name}</Heading>
						<Stack anchor="top-right">
							<Tag
								name={difficultyToString(selectedEncounter.difficulty)}
								value={
									'level' in selectedEncounter &&
									Number.isInteger(selectedEncounter.level)
										? `${selectedEncounter.level}`
										: ''
								}
								pad={{
									right:
										'level' in selectedEncounter &&
										Number.isInteger(selectedEncounter.level)
											? '0'
											: 'medium',
								}}
							/>
							{!(
								'level' in selectedEncounter &&
								Number.isInteger(selectedEncounter.level)
							) ? (
								<MaskedInput
									plain
									size="small"
									height={'xxsmall'}
									focusIndicator={false}
									color='brand'
									style={{
										textDecoration: 'underline',
										width: 45,
										// border: 'none',
										lineHeight: '0',
										display: 'block',
										marginLeft: 'auto',
									}}
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
										let level = parseInt(event.target.value);
										level = Number.isNaN(level) ? 0 : level;
										level = Array.isArray(selectedEncounter.level)
											? Math.min(
													selectedEncounter.level[1],
													Math.max(selectedEncounter.level[0], level)
												)
											: level;
										setLevel(level);
									}}
								/>
							) : (
								<></>
							)}
						</Stack>
					</Box>
				</CardHeader>
				<CardBody
					pad={{ vertical: 'large', horizontal: 'medium' }}
					background="light-1"
				>
					<Text>{selectedEncounter.description}</Text>
					<Text>Difficulty</Text>
				</CardBody>
				<CardFooter pad="small" background="light-2" justify="end">
					<Button label="Select" disabled={!level} onClick={() => {
						setPartyLevel(level)
						submit()
					}} />
				</CardFooter>
			</Card>
		</Layer>
	) : (
		<></>
	);
};
