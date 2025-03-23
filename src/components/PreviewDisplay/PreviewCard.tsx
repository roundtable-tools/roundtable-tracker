import { InitiativeParticipant } from '@/store/data';
import { Box, Card, CardBody, CardHeader, ResponsiveContext, Text } from 'grommet';
import { ReactNode, useContext } from 'react';

type InitiativeCardProps = {
	accentColor: string;
	sideTitle: ReactNode;
	sideFlag: ReactNode;
	participants: InitiativeParticipant[] | number;
};

export const PreviewCard = (props: InitiativeCardProps) => {
	const size = useContext(ResponsiveContext);
	return (
		<Box style={{position: 'relative'}}>
			<Card fill elevation="medium" border={{ color: props.accentColor, size: 'large', side: 'left' }}>
				<CardHeader background={'light-5'} pad="small" justify="start">
					<Text size="xlarge" margin={{ left: 'xlarge' }}>
						{props.sideTitle}
					</Text>
				</CardHeader>
				<CardBody pad="small">
					{Array.isArray(props.participants)
						? props.participants.map((participant) => {
								return <Box key={participant.uuid} gap={'small'} direction='row' pad={{bottom: 'small'}}><Text>{participant.name}</Text><Text>{`(${participant.level})`}</Text></Box>;
							})
						: Array.from({ length: props.participants }).map((_, index) => {
								return <Box key={index} gap={'small'} direction='row' pad={{bottom: 'small'}}><Text >Character {index + 1}</Text></Box>;
							})}
				</CardBody>
			</Card>
			<Box style={size ==='small' ? {position: 'absolute', top:-9, left: -3}: {position: 'absolute', top:-8, left: 0}}>{props.sideFlag}</Box>
		</Box>
	);
};
