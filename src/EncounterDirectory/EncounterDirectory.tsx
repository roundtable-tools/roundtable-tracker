import { Button, Card, CardBody, CardFooter, CardHeader, Layer, Text } from 'grommet';
import { Checkmark } from 'grommet-icons';
import { EncounterData } from './EncounterData';
import { useMemo, useState } from 'react';
import AbstractEcounters from './Encounters/AbstractEncounterTemplates.ts';
import { Encounter } from './Encounter.ts';
import { useEncounterStore } from '@/store/instance.ts';
import { APP_MODE } from '@/store/data.ts';

type EncounterDirectoryProps = {
	setShow: (value: boolean) => void;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const setEncounterData = useEncounterStore((state) => state.setEncounterData);
	const data = AbstractEcounters.flatMap<Encounter>(encounter => {
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
				levelRepresentation: encounter.levelRepresentation
			},
			...(encounter.variants ?? []).map((variant, index) => {
				const indexToLetter = (index: number) => String.fromCharCode(97 + index);
				return {
					id: `${encounter.id}-${indexToLetter(index + 1)}`,
					name: encounter.name,
					searchName: variant.searchName,
					level: '-',
					description: variant.description,
					difficulty: variant.difficulty ?? encounter.difficulty,
					partySize: variant.partySize ?? encounter.partySize,
					participants: variant.participants,
					levelRepresentation: encounter.levelRepresentation
				};
			})
		];
	})
	const { setShow } = props;
	const [selected, setSelected] = useState<string | number>();
	const selectedEncounterData = useMemo(() => data.find(({ id }) => id === `${selected}`), [selected, data]);
	const setAppMode = useEncounterStore((state) => state.setAppMode);
	return (
		<Layer onEsc={() => setShow(false)} onClickOutside={() => setShow(false)}>
			<Card background="light-1" width={'xlarge'} height={'xlarge'}>
				<CardHeader pad="medium"><Button label="close" onClick={() => setShow(false)} /></CardHeader>
				<CardBody pad={{horizontal: "medium"}} overflow={'auto'}>
					<EncounterData data={data} selected={selected} setSelected={setSelected}/>
				</CardBody>
				<CardFooter pad="medium" background="light-2">
					<Text>{selectedEncounterData?.description}</Text>
					<Button disabled={!selectedEncounterData} icon={<Checkmark color="plain" />} hoverIndicator label={'Select Encounter'} onClick={() => {
						if(selectedEncounterData) setEncounterData(selectedEncounterData)
						setAppMode(APP_MODE.Preview)
						setShow(false)
						console.log(selectedEncounterData)
					}}/>
				</CardFooter>
			</Card>
		</Layer>
	);
};