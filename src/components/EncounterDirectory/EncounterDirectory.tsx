import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Layer,
	Text,
} from 'grommet';
import { Checkmark } from 'grommet-icons';
import { EncounterData } from './EncounterData.tsx';
import { useMemo, useState } from 'react';
import AbstractEcounters from '../../store/Encounters/AbstractEncounterTemplates.ts';
import { Encounter } from '@/store/data.ts';
import { useEncounterStore } from '@/store/instance.ts';

type EncounterDirectoryProps = {
	setView: (view: string) => void;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const setEncounterData = useEncounterStore((state) => state.setEncounterData);
	const data = AbstractEcounters.flatMap<Encounter>((encounter) => {
		return [
			{
				id: `${encounter.id}${encounter.variants ? '-a' : ''}`,
				name: encounter.name,
				searchName: encounter.searchName,
				level: '-',
				description: encounter.description,
				difficulty: encounter.difficulty,
				partySize: encounter.partySize,
				participants: encounter.participants,
				levelRepresentation: encounter.levelRepresentation,
			},
			...(encounter.variants ?? []).map((variant, index) => {
				const indexToLetter = (index: number) =>
					String.fromCharCode(97 + index);
				return {
					id: `${encounter.id}-${indexToLetter(index + 1)}`,
					name: encounter.name,
					searchName: variant.searchName,
					level: '-',
					description: variant.description,
					difficulty: variant.difficulty ?? encounter.difficulty,
					partySize: variant.partySize ?? encounter.partySize,
					participants: variant.participants,
					levelRepresentation: encounter.levelRepresentation,
				};
			}),
		];
	});
	const { setView } = props;
	const [selected, setSelected] = useState<string | number>();
	const selectedEncounterData = useMemo(
		() => data.find(({ id }) => id === `${selected}`),
		[selected, data]
	);
	return (
		<Card background="light-1" width={'xlarge'} height={'xlarge'}>
			<CardBody pad={{ horizontal: 'medium' }} overflow={'auto'}>
				<EncounterData
					data={data}
					selected={selected}
					setSelected={setSelected}
				/>
			</CardBody>
			<CardFooter pad="medium" background="light-2">
				<Text>{selectedEncounterData?.description}</Text>
				<Button
					disabled={!selectedEncounterData}
					icon={<Checkmark color="plain" />}
					hoverIndicator
					label={'Select Encounter'}
					onClick={() => {
						if (selectedEncounterData) setEncounterData(selectedEncounterData);
						setView('preview');
						console.log(selectedEncounterData);
					}}
				/>
			</CardFooter>
		</Card>
	);
};
