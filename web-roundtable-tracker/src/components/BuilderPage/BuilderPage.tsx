import { useState, useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSavedEncountersStore } from '@/store/savedEncounterInstance';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance';
import type { ConcreteEncounter } from '@/store/data';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { ThreatTracker } from './ThreatTracker';
import { SlotRow } from './SlotRow';
import { SaveSuccessModal } from './SaveSuccessModal';
import { computeBuilderXP } from './builderXp';
import { useNavigate } from '@tanstack/react-router';
import {
	defaultFormValues,
	defaultSlot,
	fromConcreteEncounter,
	toConcreteEncounter,
	type BuilderFormValues,
} from './builderConvert';

interface BuilderPageProps {
	encounterId?: string;
}

export function BuilderPage({ encounterId }: BuilderPageProps) {
	const navigate = useNavigate();
	const [savedEncounter, setSavedEncounter] =
		useState<ConcreteEncounter | null>(null);

	const addEncounter = useSavedEncountersStore((s) => s.addEncounter);
	const updateEncounter = useSavedEncountersStore((s) => s.updateEncounter);
	const removeEncounter = useSavedEncountersStore((s) => s.removeEncounter);

	const form = useForm<BuilderFormValues>({
		defaultValues: defaultFormValues(),
	});

	const { control, handleSubmit, reset, formState } = form;

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'slots',
	});

	const slots = useWatch({ control, name: 'slots' });
	const partyLevel = useWatch({ control, name: 'partyLevel' });
	const partySize = useWatch({ control, name: 'partySize' });

	// Hydrate form when editing an existing encounter
	useEffect(() => {
		if (!encounterId) return;
		const store = getSavedEncountersStore().getState();
		const existing = store.savedEncounters.find((e) => e.id === encounterId);

		if (existing) {
			reset(fromConcreteEncounter(existing));
		}
	}, [encounterId, reset]);

	const safePartyLevel =
		typeof partyLevel === 'number' && Number.isFinite(partyLevel)
			? partyLevel
			: 1;
	const safePartySize =
		typeof partySize === 'number' && Number.isFinite(partySize) && partySize > 0
			? partySize
			: 4;
	const xp: ExperienceBudget = computeBuilderXP(slots ?? [], safePartyLevel);

	const onSubmit = (values: BuilderFormValues) => {
		const encounter = toConcreteEncounter(values, encounterId);

		if (encounterId) {
			updateEncounter(encounterId, encounter);
		} else {
			addEncounter(encounter);
		}
		setSavedEncounter(encounter);
	};

	const onDelete = () => {
		if (!encounterId) return;

		const confirmed = window.confirm(
			'This will permanently remove this saved encounter. Continue?'
		);

		if (!confirmed) return;

		removeEncounter(encounterId);
		navigate({ to: '/encounters' });
	};

	return (
		<Form {...form}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-6 max-w-4xl mx-auto p-4"
			>
			{/* Encounter header */}
			<section className="space-y-3">
				<h2 className="text-xl font-semibold">Encounter Builder</h2>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="col-span-2 space-y-1">
								<FormLabel>Encounter Name</FormLabel>
								<FormControl>
									<Input placeholder="Training Grounds" type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="partyLevel"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Party Level</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={20}
										placeholder="1"
										value={field.value ?? ''}
										onChange={(event) => {
											const value = event.target.value;

											field.onChange(value === '' ? undefined : Number(value));
										}}
										onBlur={field.onBlur}
										name={field.name}
										ref={field.ref}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="partySize"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Party Size</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										placeholder="4"
										value={field.value ?? ''}
										onChange={(event) => {
											const value = event.target.value;

											field.onChange(value === '' ? undefined : Number(value));
										}}
										onBlur={field.onBlur}
										name={field.name}
										ref={field.ref}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Description</FormLabel>
							<FormControl>
								<textarea
									className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									placeholder="Brief setup description..."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</section>

			{/* Threat Tracker */}
			<section>
				<h3 className="text-sm font-medium mb-2">Encounter Threat</h3>
				<ThreatTracker
					budget={xp}
					partySize={safePartySize}
				/>
			</section>

			{/* Slots */}
			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium">Participants &amp; Events</h3>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => append(defaultSlot())}
					>
						Add Slot
					</Button>
				</div>

				<ScrollArea className="h-[430px] pr-2">
					<div className="space-y-2">
						{fields.map((field, index) => (
							<SlotRow
								key={field.id}
								index={index}
								form={form}
								remove={remove}
								update={update}
								isOnly={fields.length === 1}
							/>
						))}
					</div>
				</ScrollArea>
			</section>

			{/* Notes */}
			<section className="space-y-3">
				<h3 className="text-sm font-medium">Notes</h3>
				<div className="grid gap-3 sm:grid-cols-3">
					<FormField
						control={form.control}
						name="gmNotes"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>GM Notes</FormLabel>
								<FormControl>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Private GM information..."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="monsterNotes"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Monster Notes</FormLabel>
								<FormControl>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Information for monster side..."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="playerNotes"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Player Notes</FormLabel>
								<FormControl>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Information for players..."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</section>

			{/* Submit */}
			<div className="flex justify-end gap-2">
				{encounterId ? (
					<Button
						type="button"
						variant="destructive"
						onClick={onDelete}
						disabled={formState.isSubmitting}
					>
						Delete Encounter
					</Button>
				) : null}
				<Button type="submit" disabled={formState.isSubmitting}>
					{encounterId ? 'Update Encounter' : 'Save Encounter'}
				</Button>
			</div>

			<SaveSuccessModal
				encounter={savedEncounter}
				onClose={() => setSavedEncounter(null)}
			/>
			</form>
		</Form>
	);
}
