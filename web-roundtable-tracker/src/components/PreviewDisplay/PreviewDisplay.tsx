import {
	ALIGNMENT,
	CharacterConfig,
	difficultyToString,
	Encounter,
	indexToLetter,
	InitiativeParticipant,
	normalizeLevel,
	Participant,
	PRIORITY,
} from '@/store/data';
import {
	Box,
	Button,
	Grid,
	Heading,
	PageContent,
	PageHeader,
	ResponsiveContext,
	Stack,
} from 'grommet';
import { generateUUID } from '@/utils/uuid';
import { PreviewCard } from './PreviewCard';
import { useEncounterStore } from '@/store/instance';
import { FlagFill, Robot, StreetView, Toast, TreeOption } from 'grommet-icons';
import { useContext, useMemo } from 'react';
import { AppHeader } from '@/AppHeader';
import { participantsToEncounterCharacters } from '@/store/convert';
import { useFieldArray, useForm } from 'react-hook-form';

type PreviewDisplayProps = {
	setView: (view: string) => void;
};

const sideToAccentColorMap: Record<number, string> = {
	0: 'accent-3',
	1: 'accent-2',
	2: 'accent-1',
	3: 'accent-4',
} as const;

const sideToNeutralColorMap: Record<number, string> = {
	0: 'neutral-3',
	1: 'neutral-2',
	2: 'neutral-1',
	3: 'neutral-4',
} as const;

const getNeutralColor = (side: number): string => {
	const normalizedSide = Math.min(3, Math.max(0, side)) as 0 | 1 | 2 | 3;

	return sideToNeutralColorMap[normalizedSide];
};

const getAligmentFlag = (side: number): JSX.Element => {
	const normalizedSide = Math.min(3, Math.max(0, side)) as 0 | 1 | 2 | 3;
	const iconSize = '34%';
	const iconColor = sideToAccentColorMap[normalizedSide];
	const padding = '90%';
	const sideToIconMap: Record<number, JSX.Element> = {
		0: (
			<StreetView
				size={iconSize}
				color={iconColor}
				style={{ paddingBottom: padding }}
			/>
		),
		1: (
			<Robot
				size={iconSize}
				color={iconColor}
				style={{ paddingBottom: padding }}
			/>
		),
		2: (
			<TreeOption
				size={iconSize}
				color={iconColor}
				style={{ paddingBottom: padding }}
			/>
		),
		3: (
			<Toast
				size={iconSize}
				color={iconColor}
				style={{ paddingBottom: padding }}
			/>
		),
	} as const;
	const flagSize = '100%';
	const flagColor = sideToNeutralColorMap[normalizedSide];

	return (
		<Stack anchor={'center'}>
			<FlagFill size={flagSize} color={flagColor} />
			{sideToIconMap[normalizedSide]}
		</Stack>
	);
};

const generateParticipants = (
	encounterData: Encounter | undefined,
	partyLevel: number
): InitiativeParticipant[][] => {
	if (!encounterData) return [];

	const groupedBySide = encounterData.participants.reduce(
		(acc, participant) => {
			if (!acc[participant.side]) {
				acc[participant.side] = [];
			}
			acc[participant.side].push(participant);

			return acc;
		},
		{} as Record<number, Participant<0 | 1>[]>
	);

	return Object.values(groupedBySide).map((participants) =>
		participants.flatMap(({ level, name, count, ...participant }) =>
			Array.from({ length: count ?? 1 }).map((_, index, { length }) => ({
				uuid: generateUUID(),
				tiePriority: PRIORITY.NPC,
				initiative: Math.floor(Math.random() * 20) + 1,
				...participant,
				level: normalizeLevel(partyLevel, level),
				name:
					length > 1 ? `${name} ${indexToLetter(index).toUpperCase()}` : name,
			}))
		)
	);
};

const generateParty = (
	encounterData: Encounter | undefined,
	partyLevel: number
): InitiativeParticipant[] => {
	return Array.from({ length: encounterData?.partySize ?? 0 }).map(
		(_, index) => ({
			uuid: generateUUID(),
			tiePriority: PRIORITY.PC,
			initiative: Math.floor(Math.random() * 20) + 1,
			level: partyLevel,
			side: ALIGNMENT.PCs,
			name: `Player ${index + 1}`,
		})
	);
};

export type Inputs = {
	teams: {
		side: number;
		characters: CharacterConfig[];
	}[];
};

export const PreviewDisplay = (props: PreviewDisplayProps): JSX.Element => {
	const startEncounter = useEncounterStore((state) => state.startEncounter);

	const size = useContext(ResponsiveContext);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setView = props.setView;

	const participants = useMemo(
		() => generateParticipants(encounterData, partyLevel),
		[encounterData, partyLevel]
	);

	const party = useMemo(
		() => generateParty(encounterData, partyLevel),
		[encounterData, partyLevel]
	);

	const fullParty = [party, ...participants];

	const { control, register, getFieldState, handleSubmit } = useForm<Inputs>({
		mode: 'onChange',
		defaultValues: {
			teams: fullParty.map((participants) => ({
				side: participants[0].side,
				characters: participants.map((participant) => ({
					initiative: 0,
					maxHealth: 1,
					tempHealth: 0,
					...participant,
					health: participant.health ?? participant.maxHealth ?? 1,
				})),
			})),
		},
	});

	const onStartEncounter = () => {
		handleSubmit(
			(data) => {
				const participants = data.teams.flatMap(({ characters }) => characters);
				startEncounter(participantsToEncounterCharacters(participants));
				setView('initiative');
			},
			(errors) => {
				console.log(errors);
			}
		)();
	};

	const { fields: teamFields } = useFieldArray({
		control,
		name: 'teams',
	});

	if (!encounterData) return <></>;

	return (
		<>
			<AppHeader setView={setView} />
			<PageContent fill>
				<PageHeader
					title={
						<Box flex direction={'row'} justify="between">
							<Heading level={1}>{encounterData?.name}</Heading>
							<Heading
								level={2}
								color={'brand'}
							>{`${difficultyToString(encounterData?.difficulty)} ${partyLevel}`}</Heading>
						</Box>
					}
				/>
				<form>
					<Grid
						columns={size === 'small' ? ['1fr'] : ['1fr', '1fr']}
						gap="medium"
						pad={{ horizontal: 'medium', vertical: 'small' }}
					>
						{teamFields.map((teamField, index) => {
							return (
								<PreviewCard
									register={register}
									getFieldState={getFieldState}
									accentColor={getNeutralColor(teamField.side)}
									key={index}
									teamIndex={index}
									sideFlag={getAligmentFlag(teamField.side)}
									sideTitle={
										Object.entries(ALIGNMENT).find(
											([, value]) => value === teamField.side
										)?.[0] ?? 'Unknown'
									}
									participants={teamField.characters}
								/>
							);
						})}
					</Grid>
				</form>
				<Button
					margin={{ top: 'medium' }}
					primary
					label="Start Encounter"
					onClick={onStartEncounter}
				/>
			</PageContent>
		</>
	);
};
