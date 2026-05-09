import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { BuilderListLayout } from '../BuilderListLayout';
import { ParagraphFields } from '../ParagraphFields';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { ALIGNMENT, type Alignment } from '@/store/data';
import type { BuilderFormValues, BuilderNote } from '../builderConvert';
import type { UseFormReturn, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';
import type { FieldArrayWithId } from 'react-hook-form';

type NoteVisibility = 'all' | Alignment;

const VISIBILITY_OPTIONS: Array<{ value: NoteVisibility; label: string }> = [
	{ value: 'all', label: 'All' },
	{ value: ALIGNMENT.Opponents, label: 'Opponents' },
	{ value: ALIGNMENT.PCs, label: 'Allies' },
	{ value: ALIGNMENT.Neutral, label: 'Other' },
];

interface NoteListSectionProps {
	form: UseFormReturn<BuilderFormValues>;
	noteFields: FieldArrayWithId<BuilderFormValues, 'notes', 'id'>[];
	notes: BuilderNote[];
	appendNote: UseFieldArrayAppend<BuilderFormValues, 'notes'>;
	removeNote: UseFieldArrayRemove;
	activeNotesTab: string;
	onActiveNotesTabChange: (id: string) => void;
}

function NoteEditor({
	form,
	index,
}: {
	form: UseFormReturn<BuilderFormValues>;
	index: number;
}) {
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
								{VISIBILITY_OPTIONS.map((option) => {
									const isActive = String(field.value ?? 'all') === String(option.value);

									return (
										<button
											key={String(option.value)}
											type="button"
											onClick={() => {
												if (option.value === 'all') {
													field.onChange('all');
												} else {
													field.onChange(Number(option.value) as Alignment);
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
}: NoteListSectionProps) {
	return (
		<BuilderListLayout
			label="Notes"
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
						});
						onActiveNotesTabChange(nextId);
					}}
				>
					Add Note
				</Button>
			}
		/>
	);
}
