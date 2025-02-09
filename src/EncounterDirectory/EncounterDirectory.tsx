import { Button, Card, CardBody, CardFooter, CardHeader, Data, DataFilter, DataFilters, DataSort, DataTable, Layer, Toolbar } from 'grommet';
import { Favorite, ShareOption } from 'grommet-icons';
import AbstractEcounters from './Encounters/AbstractEncounterTemplates.ts';
import { DIFFICULTY } from './Encounter';

type EncounterDirectoryProps = {
	setShow: (value: boolean) => void;
};

export const EncounterDirectory = (props: EncounterDirectoryProps) => {
	const { setShow } = props;
	return (
		<Layer onEsc={() => setShow(false)} onClickOutside={() => setShow(false)}>
			<Card  width="large" background="light-1">
				<CardHeader pad="medium"><Button label="close" onClick={() => setShow(false)} /></CardHeader>
				<CardBody pad="medium">
					<Data
						data={AbstractEcounters}
						toolbar
						properties={{
							id:{
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
							difficulty:{
								label: 'Difficulty',
								search: false,
								sort: false,
								filter: true,
								options: Object.entries(DIFFICULTY).map(([label, value]) => ({label, value}))
							},
							partySize:{
								label: 'Party Size',
								search: false,
								sort: false,
								filter: true,
								range: {
									min: 4,
									max: 6,
									step: 1
								},
							}
						}}
					>
						<DataTable />
					</Data>
				</CardBody>
				<CardFooter pad={{horizontal: "small"}} background="light-2">
					<Button
					icon={<Favorite color="red" />}
					hoverIndicator
					/>
					<Button icon={<ShareOption color="plain" />} hoverIndicator />
				</CardFooter>
			</Card>
		</Layer>
	);
};
