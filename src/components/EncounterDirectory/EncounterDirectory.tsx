import {
	Box,
	Button,
	Data,
	DataFilters,
	DataSearch,
	DataSort,
	Footer,
	NameValueList,
	NameValuePair,
	PageContent,
	Text,
} from 'grommet';
import { Checkmark } from 'grommet-icons';
import { EncounterData } from './EncounterData.tsx';
import { useMemo, useState } from 'react';
import AbstractEcounters from '../../store/Encounters/AbstractEncounterTemplates.ts';
import { DIFFICULTY, Encounter } from '@/store/data.ts';
import { useEncounterStore } from '@/store/instance.ts';
import { AppHeader } from '@/AppHeader.tsx';

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
					description: variant.description,
					difficulty: variant.difficulty ?? encounter.difficulty,
					partySize: variant.partySize ?? encounter.partySize,
					participants: variant.participants,
					levelRepresentation: encounter.levelRepresentation,
				};
			}),
		];
	});
	const columns = [
		{
			property: 'id',
			header: <Text size="large">ID</Text>,
			primary: true,
		},
		{
			property: 'name',
			header: <Text size="large">Name</Text>,
			render: (datum: Encounter) => {
				return (
					<NameValueList pairProps={{ direction: 'column' }}>
						<NameValuePair name={datum.name}>
							<Text color="text-strong">{`${(Object.entries(DIFFICULTY).find(([_, value]) => value == datum.difficulty) ?? ['Unknown'])[0]} | Party ${datum.partySize}${'level' in datum ? ` | Level ${datum.level}` : ''}`}</Text>
						</NameValuePair>
					</NameValueList>
				);
			},
		},
		{
			property: 'participants',
			header: <Text size="large">Participants</Text>,
			render: (datum: Encounter) => {
				const { participants } = datum;
				return (
					<Box pad={{ vertical: 'xsmall' }}>
						{participants
							? participants.reduce<string>((acc, participant) => {
									return `${acc}${acc ? ', ' : ''}${participant.name}${participant.count ? ` (x${participant.count})` : ''}`;
								}, '')
							: ''}
					</Box>
				);
			},
		},
	];
	const { setView } = props;
	const [selected, setSelected] = useState<string | number>();
	const selectedEncounterData = useMemo(
		() => data.find(({ id }) => id === `${selected}`),
		[selected, data]
	);
	return (
		<Data
			flex
			messages={{}}
			data={data}
			properties={{
				id: {
					label: 'ID',
					search: false,
					sort: true,
					filter: false,
				},
				searchName: {
					label: 'Name',
					search: true,
					sort: true,
					filter: false,
				},
				difficulty: {
					label: 'Difficulty',
					search: false,
					sort: false,
					filter: true,
					options: Object.entries(DIFFICULTY).map(([label, value]) => ({
						label,
						value,
					})),
				},
				partySize: {
					label: 'Party Size',
					search: false,
					sort: false,
					filter: true,
					range: {
						min: 4,
						max: 6,
						step: 1,
					},
				},
			}}
		>
			<AppHeader setView={setView}>
				<DataSearch />
				<DataSort drop />
				<DataFilters layer />
			</AppHeader>
			<PageContent
				align="start"
				fill
				justify="start"
				overflow={{ vertical: 'hidden' }}
			>
				<Box
					overflow={{ vertical: 'auto', horizontal: 'visible' }}
					fill="horizontal"
				>
					<EncounterData
						selected={selected}
						setSelected={setSelected}
						columns={columns}
					/>
				</Box>
			</PageContent>
			<Footer
				pad="medium"
				justify="between"
				direction="row"
				color="background-back"
			>
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
			</Footer>
		</Data>
	);
};
