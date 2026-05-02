import { cn } from '@/lib/utils';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type EncounterDataProps<T extends { directoryId: string }> = {
	table: TanStackTable<T>;
	selected?: string | number | undefined;
	setSelected?: (
		value:
			| string
			| number
			| undefined
			| ((prev: string | number | undefined) => string | number | undefined)
	) => void;
};

const SortIcon = ({ direction }: { direction: false | 'asc' | 'desc' }) => {
	if (direction === 'asc') {
		return <ArrowUp className="h-4 w-4 text-muted-foreground" />;
	}

	if (direction === 'desc') {
		return <ArrowDown className="h-4 w-4 text-muted-foreground" />;
	}

	return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
};

export const EncounterData = <T extends { directoryId: string }>({
	table,
	selected,
	setSelected,
}: EncounterDataProps<T>) => {
	const rows = table.getRowModel().rows;

	return (
		<Table className="min-w-[960px]">
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id} className="hover:bg-transparent">
						{headerGroup.headers.map((header) => (
							<TableHead
								key={header.id}
								className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80"
							>
								{header.isPlaceholder ? null : header.column.getCanSort() ? (
									<button
										type="button"
										className="flex items-center gap-2 font-medium"
										onClick={header.column.getToggleSortingHandler()}
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
										<SortIcon direction={header.column.getIsSorted()} />
									</button>
								) : (
									flexRender(
										header.column.columnDef.header,
										header.getContext()
									)
								)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{rows.length === 0 ? (
					<TableRow className="hover:bg-transparent">
						<TableCell
							colSpan={table.getAllColumns().length}
							className="h-32 text-center text-sm text-muted-foreground"
						>
							No encounters match the current search and filter settings.
						</TableCell>
					</TableRow>
				) : (
					rows.map((row) => {
						const isSelected = selected === row.original.directoryId;

						return (
							<TableRow
								key={row.id}
								data-state={isSelected ? 'selected' : undefined}
								aria-selected={isSelected}
								className={cn(
									'cursor-pointer',
									isSelected && 'bg-accent text-accent-foreground'
								)}
								onClick={() => {
									if (setSelected) {
										setSelected((prev) =>
											prev === row.original.directoryId
												? undefined
												: row.original.directoryId
										);
									}
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						);
					})
				)}
			</TableBody>
		</Table>
	);
};
