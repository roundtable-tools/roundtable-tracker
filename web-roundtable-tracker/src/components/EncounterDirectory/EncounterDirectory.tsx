import {
	Box,
	Button,
	CheckBox,
	Data,
	DataFilters,
	DataSearch,
	DataSort,
	PageContent,
	Text,
} from 'grommet';
import { Add, DocumentUpload, StreetView } from 'grommet-icons';
import { EncounterData } from './EncounterData.tsx';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import AbstractEcounters from '../../store/Encounters/EncounterTemplates.ts';
import {
	AbstractEncounter,
	CombatantParticipant,
	DIFFICULTY,
	difficultyToString,
	Encounter,
	indexToLetter,
	participantsToLevelRange,
} from '@/store/data.ts';
import { useEncounterStore } from '@/store/instance.ts';
import { AppHeader } from '@/AppHeader.tsx';
import { EncounterDetailsModal } from './EncounterDetails/EncounterDetailsModal.tsx';
import { EncounterImportModal } from './EncounterDetails/EncounterImportModal.tsx';
import { SavedConcreteEncounter } from '@/store/savedEncounters.ts';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance.ts';
import { ColumnConfig } from 'grommet/components/DataTable';

type EncounterDirectoryProps = {
	setView: (view: string) => void;
};

type EncounterDirectoryEntry = Encounter & {
	directoryId: string;
	source: 'template' | 'saved';
	difficultyLabel: string;
};

const toTemplateEntries = (
	templates: AbstractEncounter[]
): EncounterDirectoryEntry[] => {
	return templates.flatMap<EncounterDirectoryEntry>((encounter) => {
		const mainVariant: EncounterDirectoryEntry = {
			id: `${encounter.id}${encounter.variants ? '-a' : ''}`,
			directoryId: `template:${encounter.id}${encounter.variants ? '-a' : ''}`,
			source: 'template',
			name: encounter.name,
			difficultyLabel: difficultyToString(encounter.difficulty ?? DIFFICULTY.Low),
			level:
				'level' in encounter
					? encounter.level
					: participantsToLevelRange(encounter.participants),
			description: encounter.description,
			difficulty: encounter.difficulty ?? DIFFICULTY.Low,
			partySize: encounter.partySize ?? 4,
			participants: encounter.participants,
			levelRepresentation: encounter.levelRepresentation,
		};

		return [
			mainVariant,
			...(encounter.variants ?? []).map((variant, index) => {
				const id = `${encounter.id}-${indexToLetter(index + 1)}`;

				return {
					id,
					directoryId: `template:${id}`,
					source: 'template' as const,
					name: encounter.name,
					difficultyLabel: difficultyToString(
						(encounter.difficulty ?? DIFFICULTY.Low)
					),
					level:
						'level' in variant
							? (variant.level as [number, number])
							: participantsToLevelRange(variant.participants),
					description: variant.description,
					difficulty:
						variant.difficulty ?? encounter.difficulty ?? DIFFICULTY.Low,
					partySize: variant.partySize ?? encounter.partySize ?? 4,
					participants: variant.participants,
					levelRepresentation: encounter.levelRepresentation,
				};
			}),
		];
	});
};

const toSavedEntries = (
	savedEncounters: SavedConcreteEncounter[]
): EncounterDirectoryEntry[] => {
	return savedEncounters.map((encounter) => ({
		...encounter,
		directoryId: `saved:${encounter.id}`,
		source: 'saved',
		difficultyLabel: difficultyToString(encounter.difficulty ?? DIFFICULTY.Low),
	}));
};

export const getDefaultShowTemplates = (savedCount: number) => savedCount === 0;

export const createDirectoryEntries = (
	templates: AbstractEncounter[],
	savedEncounters: SavedConcreteEncounter[],
	showTemplates: boolean
): EncounterDirectoryEntry[] => {
	const savedEntries = toSavedEntries(savedEncounters);
	const templateEntries = showTemplates ? toTemplateEntries(templates) : [];

	return [...savedEntries, ...templateEntries];
};

export const toEncounter = (entry: EncounterDirectoryEntry): Encounter => {
	const { directoryId, source, ...encounter } = entry;
	void directoryId;
	void source;

	return encounter;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const { setView } = props;
	const navigate = useNavigate();
	const setEncounterData = useEncounterStore((state) => state.setEncounterData);
	const savedEncounters = useSavedEncountersStore((state) => state.savedEncounters);
	const [showTemplates, setShowTemplates] = useState(
		getDefaultShowTemplates(savedEncounters.length)
	);
	const data = useMemo(
		() =>
			createDirectoryEntries(AbstractEcounters, savedEncounters, showTemplates),
		[savedEncounters, showTemplates]
	);
	const columns: ColumnConfig<EncounterDirectoryEntry>[] = [
		{
			property: 'directoryId',
			header: <Text size="large">ID</Text>,
			primary: true,
			render: (datum: EncounterDirectoryEntry) => {
				return (
					<Box pad={{ vertical: 'xsmall' }} direction="row" gap="xsmall">
						<Text>{datum.id}</Text>
						{datum.source === 'saved' ? (
							<Text size="small" color="status-ok">
								Saved
							</Text>
						) : null}
					</Box>
				);
			},
		},
		{
			property: 'name',
			header: <Text size="large">Name</Text>,
		},
		{
			property: 'level',
			header: <Text size="large">Level</Text>,
			render: (datum: EncounterDirectoryEntry) => {
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
			render: (datum: EncounterDirectoryEntry) => {
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
				const partySize = datum.partySize ?? 4;

				return (
					<Box flex direction={'row'} pad={{ vertical: 'xsmall' }}>
						{Array.from({ length: 6 }).map((_, index) => (
							<StreetView
								key={index}
								color={index < partySize ? 'plain' : 'status-disabled'}
							/>
						))}
					</Box>
				);
			},
		},
		{
			property: 'participants',
			header: <Text size="large">Participants</Text>,
			render: (datum: EncounterDirectoryEntry) => {
				const { participants } = datum;

				return (
					<Box pad={{ vertical: 'xsmall' }}>
						<Text>
							{participants
								? participants.reduce<string>((
										acc,
										participant: CombatantParticipant
								  ) => {
										return `${acc}${acc ? ', ' : ''}${participant.name}${participant.count ? ` (x${participant.count})` : ''}`;
									}, '')
								: ''}
						</Text>
					</Box>
				);
			},
		},
	];

	const openPreview = () => {
		setView('preview');
		navigate({ to: '/preview' });
	};

	const openBuilder = () => {
		setView('builder');
		navigate({ to: '/builder' });
	};

	const [selected, setSelected] = useState<string | number>();
	const [showImportLayer, setShowImportLayer] = useState(false);
	const selectedEncounterData = useMemo(
		() => data.find(({ directoryId }) => directoryId === `${selected}`),
		[selected, data]
	);

	return (
		<Data
			flex
			messages={{}}
			data={data}
			properties={{
				directoryId: {
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
				<Box pad="small">
					<Button
						icon={<Add />}
						label="New Encounter"
						onClick={openBuilder}
					/>
				</Box>
				<Box pad="small">
					<Button
						icon={<DocumentUpload />}
						plain
						onClick={() => setShowImportLayer(true)}
					/>
				</Box>
				{savedEncounters.length > 0 ? (
					<CheckBox
						toggle
						label="Show Templates"
						checked={showTemplates}
						onChange={(event) => setShowTemplates(event.target.checked)}
					/>
				) : null}
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
				source={selectedEncounterData?.source}
				encounterId={selectedEncounterData?.id}
				submit={() => {
					if (selectedEncounterData)
						setEncounterData(toEncounter(selectedEncounterData));
					setSelected(undefined);
					openPreview();
				}}
			/>
			<EncounterImportModal
				closeLayer={() => setShowImportLayer(false)}
				submit={(encounterData: Encounter) => {
					setEncounterData(encounterData);
					setShowImportLayer(false);
					openPreview();
				}}
				showLayer={showImportLayer}
			/>
		</Data>
	);
};
