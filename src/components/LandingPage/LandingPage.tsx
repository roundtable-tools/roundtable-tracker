import { PageHeader, Grid, PageContent, ResponsiveContext } from "grommet";
import { LandingPageOption } from "./LandingPageOption";
import { useContext } from "react";

type LandingPageProps = {
	setView: (view: string) => void
}

export const LandingPage = (props: LandingPageProps) => {
	const size = useContext(ResponsiveContext);
	const {setView} = props
	return (
		<PageContent>
			<PageHeader title="Roudtable Tools" />
			<Grid
				rows={['1fr', '1fr', '1fr']}
				areas={size === 'small' ? [
					['directory', 'directory'],
					['builder', 'builder'],
					['initiative', 'initiative'],
				] :[
					['directory', 'builder'],
					['directory', 'initiative'],
				]}
				height={{max: '100%', min: 'large'}}
				gap="small"
			>
				{([
					['directory', 'Select Encounter ', 'neutral-1', false],
					['builder', 'Create New', 'neutral-2', true],
					['initiative', 'Continue', 'neutral-3', false], // disable if no encounter in local storage
				] satisfies [string,string,string,boolean][]).map(([area, title, color, disabled]) => (
					<LandingPageOption setView={setView} area={area} title={title} color={color} disabled={disabled} />
				))}
			</Grid>
		</PageContent>);
};
