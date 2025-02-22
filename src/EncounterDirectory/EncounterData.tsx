import { DIFFICULTY, Encounter } from './Encounter';
import { Data, DataTable, NameValueList, NameValuePair, Box, Text } from 'grommet';

type EncounterDataProps = {
	data: Encounter[];
    selected?: string | number | undefined;
	setSelected?: ((value: string | number | undefined | ((prev: string | number | undefined) => string | number | undefined)) => void);
};
export const EncounterData = ({ data, selected, setSelected }: EncounterDataProps) => {
	return (
		<Data
            pad={{ top: 'small' }}
            messages={{}}
			data={data}
			toolbar
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
					options: Object.entries(DIFFICULTY).map(([label, value]) => ({ label, value }))
				},
				partySize: {
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
			<DataTable
                pin={true}
                fill={true}
                allowSelectAll={false}
                select={selected ? [selected] : undefined}  
                onSelect={(arr) => {const id = arr.reverse()[0]; if(setSelected) setSelected((prev) => id == prev ? undefined : id);}}
				onClickRow={'select'}
				columns={[
					{
						property: 'id',
						header: <Text>ID</Text>,
						primary: true
					},
					{
						property: 'name',
						header: <Text>Name</Text>,
						render: datum => {
							return (<NameValueList
                                pairProps={{ direction: 'column' }}
                            >
								<NameValuePair name={datum.name}>
									<Text color="text-strong">{`${(Object.entries(DIFFICULTY).find(([_,value]) => value == datum.difficulty) ?? ['Unknown'])[0]} | Party ${datum.partySize}${datum.level != '-' ? ` | Level ${datum.level}`:''}`}</Text>
								</NameValuePair>
							</NameValueList>);
						}
					},
					{
						property: 'participants',
						header: <Text>Participants</Text>,
						render: datum => {
							const { participants } = (datum as Encounter);
							return (<Box pad={{ vertical: 'xsmall' }}>
								{participants ? participants.reduce<string>((acc, participant) => {
									return `${acc}${acc ? ', ' : ''}${participant.name}${participant.count ? ` (x${participant.count})` : ''}`;
								}, '') : ""}
							</Box>);
						},
					}
				]}
            />
		</Data>
	);
};