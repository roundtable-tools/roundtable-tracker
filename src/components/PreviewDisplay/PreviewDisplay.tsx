import { ALIGNMENT, Participant, PRIORITY } from '@/store/data';
import { Button, Grid, ResponsiveContext, Stack, Text } from 'grommet';
import { generateUUID } from '@/utils/uuid';
import { PreviewCard } from './PreviewCard';
import { useEncounterStore } from '@/store/instance';
import { Flag, FlagFill, Robot, StreetView, Toast, TreeOption } from 'grommet-icons';
import { useContext } from 'react';

type PreviewDisplayProps = {
	setView: (view: string) => void;
};
const sideToAccentColorMap = {
	0: 'accent-3',
	1: 'accent-2',
	2: 'accent-1',
	3: 'accent-4',
} as const;
const sideToNeutralColorMap = {
	0: 'neutral-3',
	1: 'neutral-2',
	2: 'neutral-1',
	3: 'neutral-4',
} as const;

const getNeutralColor = (side: number) => {
	const normalizedSide = Math.min(3, Math.max(0, side)) as 0 | 1 | 2 | 3;
	return sideToNeutralColorMap[normalizedSide];
}

const getAccentColor = (side: number) => {
	const normalizedSide = Math.min(3, Math.max(0, side)) as 0 | 1 | 2 | 3;
	return sideToAccentColorMap[normalizedSide];
}

const getAligmentFlag = (side: number) => {
	const normalizedSide = Math.min(3, Math.max(0, side)) as 0 | 1 | 2 | 3;
	const iconSize = '34%';
	const iconColor = sideToAccentColorMap[normalizedSide];
	const padding = '90%';
	const sideToIconMap = {
		0: <StreetView size={iconSize} color={iconColor} style={{paddingBottom: padding}} />,
		1: <Robot size={iconSize} color={iconColor} style={{paddingBottom: padding}} />,
		2: <TreeOption size={iconSize} color={iconColor} style={{paddingBottom: padding}} />,
		3: <Toast size={iconSize} color={iconColor} style={{paddingBottom: padding}} />,
	} as const;
	const flagSize = '100%';
	const flagColor = sideToNeutralColorMap[normalizedSide];

	return (<Stack  anchor={'center'}>
		{/* <Flag size={flagSize} color={flagColor} /> */}
		<FlagFill size={flagSize} color={flagColor} />
		{sideToIconMap[normalizedSide]}
	</Stack>);
}

export const PreviewDisplay = (props: PreviewDisplayProps) => {
	const size = useContext(ResponsiveContext);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const setView = props.setView;
	return encounterData ? (
		<>
			<Grid columns={size === 'small' ? ['1fr']: ['1fr', '1fr']} gap="medium">
				{encounterData.participants
					.reduce(
						(acc, participant) => {
							let allies = acc.find(
								(participants) => participants[0].side === participant.side
							);
							if (!allies) {
								return [...acc, [participant]];
							}
							allies.push(participant);
							return acc;
						},
						[] as Participant<0 | 1>[][]
					)
					.map((participants, index) => {
						return (
							<PreviewCard
								accentColor={getNeutralColor(participants[0].side)}
								key={index}
								sideFlag={getAligmentFlag(participants[0].side)}
								sideTitle={Object.entries(ALIGNMENT).find(
										([, value]) => value === participants[0].side
									)?.[0] ?? 'Unknown'}
								participants={participants.flatMap(
									({ level, ...participant }) =>
										Array.from({ length: participant.count ?? 1 }).map(() => ({
											uuid: generateUUID(),
											tiePriority: PRIORITY.NPC,
											...participant,
											level: Number.isInteger(level)
												? (level as number)
												: partyLevel + Number.parseInt(level as string),
										}))
								)}
							/>
						);
					})}
				<PreviewCard
					accentColor={getNeutralColor(0)}
					sideFlag={getAligmentFlag(0)}
					sideTitle={
						'Players'
					}
					participants={encounterData.partySize}
				/>
				<PreviewCard
					accentColor={getNeutralColor(2)}
					sideFlag={getAligmentFlag(2)}
					sideTitle={
						'Neutral'
					}
					participants={0}
				/>
				<PreviewCard
					accentColor={getNeutralColor(3)}
					sideFlag={getAligmentFlag(3)}
					sideTitle={
						'Toast'
					}
					participants={0}
				/>
			</Grid>
			<Button
				primary
				label="Start Encounter"
				onClick={() => setView('initiative')}
			/>
		</>
	) : (
		<></>
	);
};
