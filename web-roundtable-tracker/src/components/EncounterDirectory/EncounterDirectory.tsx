/* eslint-disable react-refresh/only-export-components */

import { AppHeader } from '@/AppHeader.tsx';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { EncounterData } from './EncounterData.tsx';
import { useNavigate } from '@tanstack/react-router';
import {
	ColumnFiltersState,
	FilterFn,
	SortingState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { Filter, Plus, Search, Upload, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import migratedEncounterTemplates from '../../store/Encounters/migratedEncounterTemplates.ts';
import {
	DIFFICULTY,
	difficultyToString,
	Encounter,
	LEVEL_REPRESENTATION,
	type Participant as StoreParticipant,
	indexToLetter,
	participantsToLevelRange,
} from '@/store/data.ts';
import type { EncounterTemplateData } from '@/models/encounters/encounter.types';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import { useEncounterStore } from '@/store/encounterRuntimeInstance.ts';
import { EncounterDetailsModal } from './EncounterDetails/EncounterDetailsModal.tsx';
import { EncounterImportModal } from './EncounterDetails/EncounterImportModal.tsx';
import { SavedConcreteEncounter } from '@/store/savedEncounters.ts';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance.ts';

type EncounterDirectoryProps = {
	setView: (view: string) => void;
};

type EncounterDirectoryEntry = Encounter & {
	directoryId: string;
	source: 'template' | 'saved';
	difficultyLabel: string;
	templateId?: string;
	templateVariantId?: string;
	templateVariantLabel?: string;
	templateVariantCount?: number;
	templateGroupId?: string;
};

const PARTY_SIZE_OPTIONS = [3, 4, 5, 6] as const;

const formatLevel = (level: EncounterDirectoryEntry['level']) => {
	if (level === undefined) {
		return 'Unknown';
	}

	return Array.isArray(level) ? `${level[0]}-${level[1]}` : `${level}`;
};

const summarizeParticipants = (participants?: StoreParticipant[]) =>
	participants
		? participants.reduce<string>((acc, participant) => {
				return `${acc}${acc ? ', ' : ''}${participant.name}${participant.count ? ` (x${participant.count})` : ''}`;
		  }, '')
		: '';

const summarizeVariantInfo = (entry: EncounterDirectoryEntry) => {
	if (entry.source !== 'template') {
		const variants = entry.variants ?? [];

		if (variants.length === 0) {
			return 'No variants';
		}

		const primaryVariant = variants[0];

		return `${variants.length} variant${variants.length === 1 ? '' : 's'}${primaryVariant?.description ? ` • ${primaryVariant.description}` : ''}`;
	}

	if (entry.templateVariantCount && entry.templateVariantCount > 1) {
		if (entry.templateVariantLabel) {
			return `Variant ${entry.templateVariantLabel} of ${entry.templateVariantCount}`;
		}

		return `${entry.templateVariantCount} template variants`;
	}

	return entry.templateVariantLabel ? `Variant ${entry.templateVariantLabel}` : 'Variant A';
};

const directoryGlobalFilter: FilterFn<EncounterDirectoryEntry> = (
	row,
	_columnId,
	filterValue
) => {
	const query = `${filterValue ?? ''}`.trim().toLowerCase();

	if (!query) {
		return true;
	}

	const encounter = row.original;
	const haystack = [
		encounter.id,
		encounter.name,
		encounter.description,
		encounter.difficultyLabel,
		summarizeVariantInfo(encounter),
		formatLevel(encounter.level),
		`${encounter.partySize ?? 4}`,
		summarizeParticipants(encounter.participants),
	]
		.join(' ')
		.toLowerCase();

	return haystack.includes(query);
};

const partySizeFilter: FilterFn<EncounterDirectoryEntry> = (
	row,
	columnId,
	filterValue
) => {
	if (filterValue === undefined) {
		return true;
	}

	return row.getValue<number>(columnId) === filterValue;
};

const toRelativeLevel = (
	level: LevelDifference
): `+${number}` | `-${number}` => level.toString() as `+${number}` | `-${number}`;

const toDirectoryDifficulty = (tags?: string[]) => {
	if (!tags || tags.length === 0) {
		return DIFFICULTY.Low;
	}

	const difficultyKey = Object.keys(DIFFICULTY).find((key) =>
		tags.some((tag) => tag.toLowerCase() === key.toLowerCase())
	) as keyof typeof DIFFICULTY | undefined;

	return difficultyKey ? DIFFICULTY[difficultyKey] : DIFFICULTY.Low;
};

const toDirectoryParticipants = (
	participants: EncounterTemplateData['variants'][number]['participants']
): StoreParticipant<typeof LEVEL_REPRESENTATION.Relative>[] => {
	return participants.map((participant) => {
		const baseParticipant = {
			name: participant.tag ?? participant.role,
			level: toRelativeLevel(participant.relativeLevel),
			side: participant.side,
			count: participant.count,
		};

		if (participant.type === 'hazard') {
			return {
				...baseParticipant,
				type: 'hazard',
				successesToDisable: participant.successesToDisable,
				isComplexHazard: participant.role === 'complex',
			};
		}

		return {
			...baseParticipant,
			type: 'creature',
			adjustment: 'none',
		};
	});
};

const toTemplateEntries = (
	templates: EncounterTemplateData[],
	groupByVariant: boolean
): EncounterDirectoryEntry[] => {
	return templates.flatMap<EncounterDirectoryEntry>((template) => {
		const difficulty = toDirectoryDifficulty(template.tags);
		const defaultVariant =
			template.variants.find(
				(variant) => variant.id === template.defaultVariantId
			) ?? template.variants[0];

		if (!defaultVariant) {
			return [];
		}

		if (!groupByVariant) {
			const participants = toDirectoryParticipants(defaultVariant.participants);

			return [
				{
					id: template.id,
					directoryId: `template:${template.id}`,
					source: 'template' as const,
					templateId: template.id,
					templateVariantId: defaultVariant.id,
					templateVariantCount: template.variants.length,
					templateGroupId: template.id,
					name: template.name,
					difficultyLabel: difficultyToString(difficulty),
					level: participantsToLevelRange(participants),
					description: defaultVariant.description ?? template.description,
					difficulty,
					partySize: defaultVariant.partySize,
					participants,
					levelRepresentation: LEVEL_REPRESENTATION.Relative,
				},
			];
		}

		const nonDefaultVariants = template.variants.filter(
			(variant) => variant.id !== defaultVariant.id
		);
		const orderedVariants = [defaultVariant, ...nonDefaultVariants];

		return orderedVariants.map((variant, index) => {
			const variantLabel = indexToLetter(index).toUpperCase();
			const id = `${template.id}-${variantLabel.toLowerCase()}`;
			const participants = toDirectoryParticipants(variant.participants);

			return {
				id,
				directoryId: `template:${id}`,
				source: 'template' as const,
				templateId: template.id,
				templateVariantId: variant.id,
				templateVariantLabel: variantLabel,
				templateVariantCount: orderedVariants.length,
				templateGroupId: template.id,
				name: template.name,
				difficultyLabel: difficultyToString(difficulty),
				level: participantsToLevelRange(participants),
				description: variant.description ?? template.description,
				difficulty,
				partySize: variant.partySize,
				participants,
				levelRepresentation: LEVEL_REPRESENTATION.Relative,
			};
		});
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
	templates: EncounterTemplateData[],
	savedEncounters: SavedConcreteEncounter[],
	showTemplates: boolean,
	groupByVariant = true
): EncounterDirectoryEntry[] => {
	const savedEntries = toSavedEntries(savedEncounters);
	const templateEntries = showTemplates
		? toTemplateEntries(templates, groupByVariant)
		: [];

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
	const removeEncounter = useSavedEncountersStore((state) => state.removeEncounter);
	const [showTemplates, setShowTemplates] = useState(
		getDefaultShowTemplates(savedEncounters.length)
	);
	const [groupByVariant, setGroupByVariant] = useState(true);
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [selected, setSelected] = useState<string | number>();
	const [showImportLayer, setShowImportLayer] = useState(false);
	const data = useMemo(
		() =>
			createDirectoryEntries(
				migratedEncounterTemplates,
				savedEncounters,
				showTemplates,
				groupByVariant
			),
		[savedEncounters, showTemplates, groupByVariant]
	);

	useEffect(() => {
		if (savedEncounters.length === 0) {
			setShowTemplates(true);
		}
	}, [savedEncounters.length]);

	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<EncounterDirectoryEntry>();

		return [
			columnHelper.accessor('id', {
				id: 'directoryId',
				header: 'ID',
				cell: ({ row, getValue }) => (
					<div className="flex items-center gap-2 py-1">
						<span className="font-medium">{getValue()}</span>
						{row.original.source === 'saved' ? (
							<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
								Saved
							</span>
						) : (
							<span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
								Template
							</span>
						)}
						{row.original.templateVariantLabel ? (
							<span className="rounded-full border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
								Variant {row.original.templateVariantLabel}
							</span>
						) : null}
					</div>
				),
			}),
			columnHelper.accessor('name', {
				header: 'Name',
				cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
			}),
			columnHelper.accessor(
				(row) => (Array.isArray(row.level) ? row.level[0] : row.level),
				{
					id: 'level',
					header: 'Level',
					cell: ({ row }) => <span>{formatLevel(row.original.level)}</span>,
				}
			),
			columnHelper.accessor('difficultyLabel', {
				id: 'difficultyLabel',
				header: 'Difficulty',
				filterFn: 'equalsString',
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			columnHelper.accessor((row) => row.partySize ?? 4, {
				id: 'partySize',
				header: 'Party Size',
				filterFn: partySizeFilter,
				cell: ({ getValue }) => {
					const partySize = getValue();

					return (
						<div className="flex items-center gap-1 py-1">
							{Array.from({ length: 6 }).map((_, index) => (
								<UserRound
									key={index}
									className={cn(
										'h-4 w-4',
										index < partySize
											? 'text-foreground'
											: 'text-muted-foreground/40'
									)}
								/>
							))}
						</div>
					);
				},
			}),
			columnHelper.accessor((row) => summarizeParticipants(row.participants), {
				id: 'participants',
				header: 'Participants',
				enableSorting: false,
				cell: ({ getValue }) => (
					<span className="text-sm text-muted-foreground">{getValue()}</span>
				),
			}),
			columnHelper.accessor((row) => summarizeVariantInfo(row), {
				id: 'variants',
				header: 'Variants',
				enableSorting: false,
				cell: ({ getValue }) => (
					<span className="text-sm text-muted-foreground">{getValue()}</span>
				),
			}),
		];
	}, []);

	const openPreview = () => {
		setView('preview');
		navigate({ to: '/preview' });
	};

	const openBuilder = () => {
		setView('builder');
		const params: Record<string, string | null> = {};

		if (selectedEncounterData?.source === 'saved' && selectedEncounterData?.id) {
			params.encounterId = selectedEncounterData.id;
		} else if (
			selectedEncounterData?.source === 'template' &&
			selectedEncounterData?.templateId
		) {
			params.templateId = selectedEncounterData.templateId;
			if (selectedEncounterData.templateVariantId) {
				params.templateVariantId = selectedEncounterData.templateVariantId;
			}
		}

		navigate({
			to: '/builder',
			search: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null)),
		});
	};

	const selectedEncounterData = useMemo(
		() => data.find(({ directoryId }) => directoryId === `${selected}`),
		[selected, data]
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			globalFilter,
			sorting,
			columnFilters,
		},
		globalFilterFn: directoryGlobalFilter,
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getRowId: (row) => row.directoryId,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const difficultyFilterValue = table.getColumn('difficultyLabel')?.getFilterValue() as
		| string
		| undefined;
	const partySizeFilterValue = table.getColumn('partySize')?.getFilterValue() as
		| number
		| undefined;
	const visibleRowCount = table.getRowModel().rows.length;
	const hasActiveFilters = Boolean(
		globalFilter || difficultyFilterValue !== undefined || partySizeFilterValue !== undefined
	);

	const deleteSelectedEncounter = () => {
		if (!selectedEncounterData || selectedEncounterData.source !== 'saved') {
			return;
		}

		removeEncounter(selectedEncounterData.id);
		setSelected(undefined);
	};

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<AppHeader setView={setView}>
				<div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
					<div className="flex items-center gap-2">
					<Button
						className="bg-white text-slate-900 hover:bg-white/90"
						onClick={openBuilder}
					>
						<Plus className="h-4 w-4" />
						New Encounter
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="text-white hover:bg-white/10 hover:text-white"
						onClick={() => setShowImportLayer(true)}
					>
						<Upload className="h-4 w-4" />
						<span className="sr-only">Import Encounter</span>
					</Button>
					</div>
					<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
						{savedEncounters.length > 0 ? (
							<label className="flex items-center gap-2 text-sm font-medium text-white">
								<Switch
									checked={showTemplates}
									onCheckedChange={setShowTemplates}
									aria-label="Show templates"
								/>
								Show Templates
							</label>
						) : null}
						{showTemplates ? (
							<label className="flex items-center gap-2 text-sm font-medium text-white">
								<Switch
									checked={groupByVariant}
									onCheckedChange={setGroupByVariant}
									aria-label="Group templates by variant"
								/>
								Group by variant
							</label>
						) : null}
						<div className="relative min-w-0 flex-1 sm:max-w-sm">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
							<Input
								aria-label="Search encounters"
								value={globalFilter}
								onChange={(event) => setGlobalFilter(event.target.value)}
								className="h-9 border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/70"
								placeholder="Search encounters"
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="secondary"
									className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
								>
									<Filter className="h-4 w-4" />
									Filters
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64">
								<DropdownMenuLabel>Difficulty</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={difficultyFilterValue ?? 'all'}
									onValueChange={(value) => {
										table
											.getColumn('difficultyLabel')
											?.setFilterValue(value === 'all' ? undefined : value);
									}}
								>
									<DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
									{Object.keys(DIFFICULTY)
										.filter((key) => key !== 'Unknown')
										.map((key) => (
											<DropdownMenuRadioItem key={key} value={key}>
												{key}
											</DropdownMenuRadioItem>
										))}
								</DropdownMenuRadioGroup>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Party Size</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={partySizeFilterValue ? `${partySizeFilterValue}` : 'all'}
									onValueChange={(value) => {
										table
											.getColumn('partySize')
											?.setFilterValue(
												value === 'all' ? undefined : Number(value)
											);
									}}
								>
									<DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
									{PARTY_SIZE_OPTIONS.map((value) => (
										<DropdownMenuRadioItem key={value} value={`${value}`}>
											{value} players
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => {
										setGlobalFilter('');
										setColumnFilters([]);
										setSorting([]);
									}}
								>
									Reset search, filters, and sort
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</AppHeader>
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
				<section className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
							Encounter Directory
						</p>
						<h1 className="text-3xl font-semibold tracking-tight">
							Saved encounters and templates
						</h1>
						<p className="text-sm text-muted-foreground">
							Browse, filter, import, and launch encounters from one view.
						</p>
					</div>
					<div className="text-sm text-muted-foreground">
						{visibleRowCount} shown of {data.length}
					</div>
				</section>
				<div className="flex flex-wrap items-center gap-2">
					{globalFilter ? (
						<span className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
							Search: {globalFilter}
						</span>
					) : null}
					{difficultyFilterValue ? (
						<span className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
							Difficulty: {difficultyFilterValue}
						</span>
					) : null}
					{partySizeFilterValue ? (
						<span className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
							Party Size: {partySizeFilterValue}
						</span>
					) : null}
					{hasActiveFilters ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setGlobalFilter('');
								setColumnFilters([]);
							}}
						>
							<X className="h-4 w-4" />
							Clear filters
						</Button>
					) : null}
				</div>
				<div className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card shadow-sm">
					<ScrollArea className="h-full">
						<EncounterData
							table={table}
							selected={selected}
							setSelected={setSelected}
						/>
					</ScrollArea>
				</div>
			</main>
			<EncounterDetailsModal
				closeLayer={() => setSelected(undefined)}
				selectedEncounter={selectedEncounterData}
				source={selectedEncounterData?.source}
				encounterId={selectedEncounterData?.id}
				templateId={selectedEncounterData?.templateId}
				templateVariantId={selectedEncounterData?.templateVariantId}
				onDelete={deleteSelectedEncounter}
				submit={(encounter) => {
					const data = encounter ?? (selectedEncounterData ? toEncounter(selectedEncounterData) : undefined);
					if (data) setEncounterData(data);
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
		</div>
	);
};
