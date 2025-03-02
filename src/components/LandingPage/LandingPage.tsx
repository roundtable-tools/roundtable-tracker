import {
	PageHeader,
	Grid,
	PageContent,
	ResponsiveContext,
	Box,
	Text,
	Stack,
} from 'grommet';
import { LandingPageOption } from './LandingPageOption';
import { ReactNode, useContext } from 'react';
import { FolderOpen, FormClock, PlayFill, Tools } from 'grommet-icons';

type LandingPageProps = {
	setView: (view: string) => void;
};

export const LandingPage = (props: LandingPageProps) => {
	const size = useContext(ResponsiveContext);
	const { setView } = props;
	return (
		<PageContent>
			<PageHeader title="Roudtable Tools" />
			<Grid
				rows={['1fr', '1fr', size=== 'small' ? '1fr' : '0.25fr']}
				areas={
					size === 'small'
						? [
								['directory', 'directory'],
								['builder', 'builder'],
								['initiative', 'initiative'],
							]
						: [
								['directory', 'builder'],
								['directory', 'initiative'],
							]
				}
				height={{ max: '100%', min: 'large' }}
				gap="small"
			>
				{(
					[
						[
							'directory',
							'Select Encounter',
							<FolderOpen size='150%'/>,
							'neutral-1',
							false,
						],
						['builder', 'Create New', 
							<Tools size='150%'/>, 'neutral-2', true],
						['initiative', 'Continue', <Stack anchor='left'>
							<PlayFill size='150%'/>
							<FormClock size='110%' color='neutral-3'/>
						</Stack>, 'neutral-3', false], // disable if no encounter in local storage
					] satisfies [string, ReactNode, ReactNode, string, boolean][]
				).map(([area, title, icon, color, disabled]) => (
					<LandingPageOption
						key={area}
						setView={setView}
						area={area}
						title={
							<Box flex direction="column" align="center" gap={size === 'small' ? 'small' : 'medium'}>
								{icon}
								<Text size="xxlarge">{title}</Text>
							</Box>
						}
						color={color}
						disabled={disabled}
					/>
				))}
			</Grid>
		</PageContent>
	);
};
