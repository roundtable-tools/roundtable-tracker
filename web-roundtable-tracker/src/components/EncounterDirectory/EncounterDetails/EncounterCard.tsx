import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Heading,
	Tag,
	Stack,
	MaskedInput,
	Box,
	Button,
	Text,
} from 'grommet';
import { difficultyToString, Encounter } from '@/store/data';
import { useEffect, useState } from 'react';
import { useEncounterStore } from '@/store/instance';

type EncounterCardProps = {
	selectedEncounter: Encounter;
	submit: (encounter?: Encounter) => void;
	close: () => void;
};

export const EncounterCard = (props: EncounterCardProps) => {
	const { selectedEncounter, submit, close } = props;
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setPartyLevel = useEncounterStore((state) => state.setPartyLevel);
	const [level, setLevel] = useState<number>(partyLevel);
	useEffect(() => {
		const level = Array.isArray(selectedEncounter.level)
			? Math.max(
					selectedEncounter.level[0],
					Math.min(selectedEncounter.level[1], partyLevel)
				)
			: selectedEncounter.level || 0;
		setLevel(level);
	}, [partyLevel, selectedEncounter]);

	return (
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
								color="brand"
								style={{
									textDecoration: 'underline',
									width: 45,
									lineHeight: '0',
									display: 'block',
									marginLeft: 'auto',
								}}
								mask={[
									{
										length: [1, 2],
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
				<Button label="Back" onClick={close}></Button>
				<Button
					label="Select"
					disabled={!level}
					onClick={() => {
						setPartyLevel(level);
						submit();
					}}
				/>
			</CardFooter>
		</Card>
	);
};
