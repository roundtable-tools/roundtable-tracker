import { Encounter } from '@/store/data';
import { DataTable, ColumnConfig, ThemeContext } from 'grommet';

type EncounterDataProps = {
	selected?: string | number | undefined;
	setSelected?: (
		value:
			| string
			| number
			| undefined
			| ((prev: string | number | undefined) => string | number | undefined)
	) => void;
	columns: ColumnConfig<Encounter>[];
};
export const EncounterData = ({
	columns,
	selected,
	setSelected,
}: EncounterDataProps) => {
	return (
		<ThemeContext.Extend
			value={{
				dataTable: {
					body: {
						selected: {
							background: 'active',
							color: 'text',
						},
					},
					pinned: {
						header: {
							background: 'light-2',
						},
					},
				},
				checkBox: {
					extend: {
						display: 'none',
					},
				},
			}}
		>
			<DataTable
				pin={true}
				fill={true}
				allowSelectAll={false}
				select={selected ? [selected] : undefined}
				onSelect={(arr) => {
					const id = arr.reverse()[0];
					if (setSelected) setSelected((prev) => (id == prev ? undefined : id));
				}}
				onClickRow={'select'}
				columns={columns}
			/>
		</ThemeContext.Extend>
	);
};
