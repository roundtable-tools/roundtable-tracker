import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
	BuilderListLayout,
	type BuilderListLayoutKey,
} from '../BuilderListLayout';
import { ParagraphFields } from '../ParagraphFields';
import {
	FormField,
	FormItem,
	FormLabel,
	FormControl,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { factionAlignmentToAlignment } from '@/store/data';
import type { BuilderFormValues, BuilderNote } from '../builderConvert';
import type {
	UseFormReturn,
	UseFieldArrayAppend,
	UseFieldArrayRemove,
} from 'react-hook-form';
import type { FieldArrayWithId } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { type EncounterFaction } from '@/models/encounters/factions';

type NoteVisibilityOption =
	| { value: 'all'; label: string }
	| { value: string; label: string; faction: EncounterFaction };

function resolveNoteVisibilityOptions(
	factions: EncounterFaction[]
): NoteVisibilityOption[] {
	return [
		{ value: 'all', label: 'All' },
		...factions.map((faction) => ({
			value: faction.id,
			label: faction.name,
			faction,
		})),
	];
}

interface NoteListSectionProps {
	form: UseFormReturn<BuilderFormValues>;
	noteFields: FieldArrayWithId<BuilderFormValues, 'notes', 'id'>[];
	notes: BuilderNote[];
	appendNote: UseFieldArrayAppend<BuilderFormValues, 'notes'>;
	removeNote: UseFieldArrayRemove;
	activeNotesTab: string;
	onActiveNotesTabChange: (id: string) => void;
	layoutKey?: BuilderListLayoutKey;
	onLayoutKeyChange?: (key: BuilderListLayoutKey) => void;
}

function NoteEditor({
	form,
	index,
}: {
	form: UseFormReturn<BuilderFormValues>;
	index: number;
}) {
	const factions = useWatch({ control: form.control, name: 'factions' }) ?? [];
	const noteFactionId =
		useWatch({ control: form.control, name: `notes.${index}.factionId` as const }) ??
		undefined;
	const visibilityOptions = resolveNoteVisibilityOptions(factions);

	return (
		<div className="space-y-3">
			<FormField
				control={form.control}
				name={`notes.${index}.visibility` as const}
				render={({ field }) => (
					<FormItem className="space-y-1">
						<FormLabel>Visibility</FormLabel>
						<FormControl>
							<div className="flex flex-wrap gap-1">
									{visibilityOptions.map((option) => {
										const isActive =
											option.value === 'all'
												? (field.value ?? 'all') === 'all' && !noteFactionId
												: noteFactionId === option.value;

									return (
										<button
											key={String(option.value)}
											type="button"
											onClick={() => {
												if (option.value === 'all') {
													field.onChange('all');
														form.setValue(
															`notes.${index}.factionId` as const,
															undefined
														);
												} else {
														field.onChange(
															factionAlignmentToAlignment(option.faction.alignment)
														);
														form.setValue(
															`notes.${index}.factionId` as const,
															option.value
														);
												}
											}}
											className={cn(
												'rounded border px-3 py-1 text-xs transition-colors',
												isActive
													? 'bg-primary text-primary-foreground border-primary'
													: 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
											)}
										>
											{option.label}
										</button>
									);
								})}
							</div>
						</FormControl>
					</FormItem>
				)}
			/>
			<ParagraphFields
				control={form.control}
				label="Note Details"
				fieldNames={[
					`notes.${index}.header` as const,
					`notes.${index}.content` as const,
				]}
				placeholders={['Note Header', 'Note Content']}
			/>
		</div>
	);
}

export function NoteListSection({
	form,
	noteFields,
	notes,
	appendNote,
	removeNote,
	activeNotesTab,
	onActiveNotesTabChange,
	layoutKey,
	onLayoutKeyChange,
}: NoteListSectionProps) {
	return (
		<BuilderListLayout
			label="Notes"
			layoutKey={layoutKey}
			onLayoutKeyChange={onLayoutKeyChange}
			allowedLayouts={['compact-tabs', 'list', 'wide-grid']}
			items={noteFields}
			getItemId={(noteField, index) => notes[index]?.id ?? noteField.id}
			getItemLabel={(_, index) => {
				const note = notes[index];

				return note?.header?.trim().length ? note.header : `Note ${index + 1}`;
			}}
			renderItem={(_, index) => <NoteEditor form={form} index={index} />}
			onRemoveItem={(_, index) => removeNote(index)}
			emptyState={
				<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
					No notes yet. Add a note to capture encounter context.
				</div>
			}
			activeItemId={activeNotesTab}
			onActiveItemIdChange={onActiveNotesTabChange}
			toolbarActions={
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						const nextIndex = notes.length + 1;
						const nextId = uuidv4();

						appendNote({
							id: nextId,
							header: `Note ${nextIndex}`,
							content: '',
							visibility: 'all',
							factionId: undefined,
						});
					}}
				>
					Add Note
				</Button>
			}
		/>
	);
}
