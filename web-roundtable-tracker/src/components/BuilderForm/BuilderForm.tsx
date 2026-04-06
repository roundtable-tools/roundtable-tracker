'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';


import { Encounter } from '@/models/encounters/Encounter.class';
import { Card } from '@/components/ui//card';
import { InputField } from './InputField';
import { ScrollArea } from '@/components/ui//scroll-area';
import { ThreadTracker } from './ThreadTracker';
import { Threat } from '@/models/utility/threat/Threat.class';
import { Level } from '@/models/utility/level/Level';
import { CreatureSlot } from '@/models/encounters/slots/CreatureSlot';
import { ReinforcementSlot } from '@/models/encounters/slots/ReinforcementSlot';
import { NarrativeSlot } from '@/models/encounters/slots/NarrativeSlot';
import { AuraSlot } from '@/models/encounters/slots/AuraSlot';
import { TemplateSlotType } from '@/models/encounters/slots/TemplateSlot.class';


const SLOT_TYPE_OPTIONS = [
	{ value: 'creature', label: 'Creature' },
	{ value: 'reinforcement', label: 'Reinforcement Creature' },
	{ value: 'narrative', label: 'Narrative Event' },
	{ value: 'aura', label: 'Aura Event' },
];

const SLOT_TYPE_TO_FIELDS = {
	creature: CreatureSlot.getFieldDescriptors(),
	reinforcement: ReinforcementSlot.getFieldDescriptors(),
	narrative: NarrativeSlot.getFieldDescriptors(),
	aura: AuraSlot.getFieldDescriptors(),
} as const;

const SLOT_TYPE_TO_DEFAULT = {
	creature: { type: 'creature', name: '', description: '', side: 'enemy' },
	reinforcement: { type: 'reinforcement', name: '', description: '', side: 'enemy', reinforcementRound: 1 },
	narrative: { type: 'narrative', name: '', description: '', eventRound: 1 },
	aura: { type: 'aura', name: '', description: '', auraTarget: 'everyone', auraCycle: 1 },
} as const;

export function BuilderForm() {
	const form = useForm<z.infer<typeof Encounter.Schema>>({
		resolver: zodResolver(Encounter.Schema),
		defaultValues: {
			name: '',
			description: '',
			partySize: 4,
			partyLevel: Level.One,
			slots: [{ id: uuidv4(), ...SLOT_TYPE_TO_DEFAULT.creature }],
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control: form.control,
		name: 'slots',
	});

	const budget = Threat.TrivialMinus.toExpBudget(form.watch('partySize'));

	// Helper to render fields for a slot
	function renderSlotFields(slot: any, index: number) {
		const slotType: TemplateSlotType = slot.type;
		const fieldDescriptors = SLOT_TYPE_TO_FIELDS[slotType];
		return (
			<div className="flex gap-2 items-start mb-2 flex-wrap" key={slot.id || index}>
				<div className="flex-2 min-w-[140px]">
					<label className="block text-sm font-medium mb-1">Type</label>
					<Select
						value={slotType}
						onValueChange={val => {
							const newType = val as TemplateSlotType;
							update(index, { ...SLOT_TYPE_TO_DEFAULT[newType], id: slot.id });
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select type..." />
						</SelectTrigger>
						<SelectContent>
							{SLOT_TYPE_OPTIONS.map(opt => (
								<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{fieldDescriptors.map(field => (
					<div className="flex-1 min-w-[100px]" key={field.name}>
						<label className="block text-sm font-medium mb-1">{field.label}</label>
						{field.type === 'select' ? (
							<Select
								value={slot[field.name] ?? ''}
								onValueChange={val => form.setValue(`slots.${index}.${field.name}` as any, val)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select..." />
								</SelectTrigger>
								<SelectContent>
									{field.options?.map(opt => (
										<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								type={field.type === 'number' ? 'number' : 'text'}
								placeholder={field.placeholder}
								{...form.register(`slots.${index}.${field.name}` as any)}
							/>
						)}
					</div>
				))}
				<div className="flex-1 min-w-[80px] flex items-end">
					<Button
						type="button"
						variant="destructive"
						onClick={() => remove(index)}
						disabled={fields.length === 1}
					>
						Remove
					</Button>
				</div>
			</div>
		);
	}

	return (
	   <Form {...form}>
		   <form className="space-y-8 p-4" onSubmit={form.handleSubmit(values => console.log(values))}>
			   <div className="mb-6">
				   <ThreadTracker budget={budget} />
			   </div>
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
					   {fields.map((slot, idx) => renderSlotFields(slot, idx))}
				   </ScrollArea>
				   <Button
					   type="button"
					   variant="secondary"
					   onClick={() => append({ id: uuidv4(), ...SLOT_TYPE_TO_DEFAULT.creature })}
				   >
					   Add Slot
				   </Button>
			   </Card>
			   <Button type="submit">Create Encounter</Button>
		   </form>
	   </Form>
	);
}
