'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormLabel } from '@/components/ui/form';

import { Encounter } from '@/models/encounters/Encounter.class';
import { EncounterSlot } from '@/models/encounters/EncounterSlot.class';
import { Card } from '@/components/ui//card';
import { InputField } from './InputField';
import { ScrollArea } from '@/components/ui//scroll-area';
import { ThreadTracker } from './ThreadTracker';
import { Threat } from '@/models/utility/threat/Threat.class';
import { Level } from '@/models/utility/level/Level';
import { TemplateEvent } from '@/models/templates/TemplateEvent.class';
import { EncounterSlotFields } from './SlotFields/EncounterSlotFields';

export function BuilderForm() {
	const form = useForm<z.infer<typeof Encounter.Schema>>({
		resolver: zodResolver(Encounter.Schema),
		defaultValues: {
			name: '',
			description: '',
			partySize: 4,
			partyLevel: Level.One,
			slots: [{
				type: 'creature',
				name: '',
				description: '',
				side: 'enemy',
				reinforcementRound: undefined,
				eventRound: undefined,
				auraTarget: undefined,
				auraCycle: undefined,
			}],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'slots',
	});

	const isValidTemplateEvent = (event: Record<string, unknown>): event is z.infer<typeof TemplateEvent.Schema> => {
		return (
			typeof event === "object" &&
			event !== null &&
			typeof event.turn === "number" &&
			(typeof event.description === "string" || typeof event.description === "undefined")
		);
	};

	function onSubmit(values: z.infer<typeof Encounter.Schema>) {
		const encounterSlots = values.slots.map((slot) => {
			const { event, offset, ...rest } = slot;
			return new EncounterSlot({
				...rest,
				event: event && isValidTemplateEvent(event) ? new TemplateEvent(event) : undefined,
			});
		});
		const encounter = new Encounter({
			name: values.name,
			description: values.description ?? '',
			partySize: values.partySize,
			partyLevel: values.partyLevel,
			slots: encounterSlots,
		});
		console.log(encounter);
	}

  	const budget = Threat.TrivialMinus.toExpBudget(form.watch('partySize'));

	return (
		<Form {...form}>
      <div className="mb-6 p-4">
        <ThreadTracker budget={budget} />
      </div>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
				<InputField
					control={form.control}
					name="name"
					label="Encounter Name"
					placeholder="Goblin Ambush"
				/>
				<InputField
					control={form.control}
					name="description"
					label="Description"
					placeholder="Describe the encounter..."
				/>
				<div className="flex items-center gap-4">
					<InputField
						control={form.control}
						name="partyLevel"
						label="Party Level"
						placeholder="1"
						type="number"
					/>
					<InputField
						control={form.control}
						name="partySize"
						label="Party Size"
						placeholder="4"
						type="number"
					/>
				</div>

				<Card className="p-4">
					<FormLabel>Encounter Slots</FormLabel>
					<ScrollArea className="h-72">
						<EncounterSlotFields
							fields={fields}
							form={form}
							remove={remove}
						/>
					</ScrollArea>
					<Button
						type="button"
						variant="secondary"
						onClick={() => append({
							type: 'creature',
							name: '',
							description: '',
							side: 'enemy',
							reinforcementRound: undefined,
							eventRound: undefined,
							auraTarget: undefined,
							auraCycle: undefined,
						})}
					>
						Add Slot
					</Button>
				</Card>
				<Button type="submit">Create Encounter</Button>
			</form>
		</Form>
	);
}
