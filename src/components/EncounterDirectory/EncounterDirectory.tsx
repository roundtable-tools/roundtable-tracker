import {
	Box,
	Data,
	DataFilters,
	DataSearch,
	DataSort,
	PageContent,
	Text,
} from 'grommet';
import { StreetView } from 'grommet-icons';
import { EncounterData } from './EncounterData.tsx';
import { useMemo, useState } from 'react';
import AbstractEcounters from '../../store/Encounters/AbstractEncounterTemplates.ts';
import {
	DIFFICULTY,
	difficultyToString,
	Encounter,
	indexToLetter,
	participantsToLevelRange,
} from '@/store/data.ts';
import { useEncounterStore } from '@/store/instance.ts';
import { AppHeader } from '@/AppHeader.tsx';
import { EncounterDetailsModal } from './EncounterDetailsModal.tsx';

type EncounterDirectoryProps = {
	setView: (view: string) => void;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const setEncounterData = useEncounterStore((state) => state.setEncounterData);
	const data = AbstractEcounters.flatMap<Encounter>((encounter) => {
		const mainVariant = {
			id: `${encounter.id}${encounter.variants ? '-a' : ''}`,
			name: encounter.name,
			difficultyLabel: difficultyToString(encounter.difficulty),
			level:
				'level' in encounter
					? encounter.level
					: participantsToLevelRange(encounter.participants),
			description: encounter.description,
			difficulty: encounter.difficulty,
			partySize: encounter.partySize,
			participants: encounter.participants,
			levelRepresentation: encounter.levelRepresentation,
		};

		return [
			mainVariant,
			...(encounter.variants ?? []).map((variant, index) => {
				return {
					id: `${encounter.id}-${indexToLetter(index + 1)}`,
					name: encounter.name,
					difficultyLabel: difficultyToString(encounter.difficulty),
					level:
						'level' in variant
							? (variant.level as [number, number])
							: participantsToLevelRange(variant.participants),
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
		},
		{
			property: 'level',
			header: <Text size="large">Level</Text>,
			render: (datum: Encounter) => {
				return (
					<Box pad={{ vertical: 'xsmall' }}>
						<Text>
							{datum.level === undefined
								? 'Unknown'
								: Array.isArray(datum.level)
									? `${datum.level[0]}-${datum.level[1]}`
									: datum.level}
						</Text>
					</Box>
				);
			},
		},
		{
			property: 'difficulty',
			header: <Text size="large">Difficulty</Text>,
			render: (datum: Encounter) => {
				return (
					<Box pad={{ vertical: 'xsmall' }}>
						<Text>
							{
								(Object.entries(DIFFICULTY).find(
									([, value]) => value == datum.difficulty
								) ?? ['Unknown'])[0]
							}
						</Text>
					</Box>
				);
			},
		},
		{
			property: 'partySize',
			header: <Text size="large">Party Size</Text>,
			render: (datum: Encounter) => {
				return (
					<Box flex direction={'row'} pad={{ vertical: 'xsmall' }}>
						{Array.from({ length: 6 }).map((_, index) => (
							<StreetView
								key={index}
								color={index < datum.partySize ? 'plain' : 'status-disabled'}
							/>
						))}
					</Box>
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
			primary: true,
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
				name: {
					label: 'Name',
					search: true,
					sort: true,
					filter: false,
				},
				level: {
					label: 'Level',
					search: true,
					sort: true,
					filter: false,
					range: {
						min: 1,
						max: 20,
						step: 1,
					},
				},
				difficultyLabel: {
					label: 'Difficulty',
					search: true,
					sort: false,
					filter: true,
					options: Object.keys(DIFFICULTY)
						.filter((el) => el != 'Unknown')
						.map((key) => ({
							value: key,
							label: key,
						})),
				},
				partySize: {
					label: 'Party Size',
					search: true,
					sort: false,
					filter: true,
					range: {
						min: 3,
						max: 6,
						step: 1,
					},
				},
				participants: {
					label: 'Participants',
					search: true,
					sort: false,
					filter: false,
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
			<EncounterDetailsModal
				closeLayer={() => setSelected(undefined)}
				selectedEncounter={selectedEncounterData}
				submit={() => {
					if (selectedEncounterData) setEncounterData(selectedEncounterData);
					setView('preview');
					console.log(selectedEncounterData);
				}}
			/>
		</Data>
	);
};
