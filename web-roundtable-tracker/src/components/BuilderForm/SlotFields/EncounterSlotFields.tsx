import { Button } from '@/components/ui/button';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import {
    FieldArrayWithId,
    UseFieldArrayRemove,
    UseFormReturn,
} from 'react-hook-form';
import { EncounterSlotFieldsAura } from './EncounterSlotFieldsAura';
import { EncounterSlotFieldsCreature } from './EncounterSlotFieldsCreature';
import { EncounterSlotFieldsNarrative } from './EncounterSlotFieldsNarrative';
import { EncounterSlotFieldsReinforcement } from './EncounterSlotFieldsReinforcement';
import { SlotSelectField } from './SlotSelectField';

type EncounterSlotFieldsProps = {
    fields: FieldArrayWithId<any, 'slots', 'id'>[];
    form: UseFormReturn<any>;
    remove: UseFieldArrayRemove;
};

export type EncounterSlotFieldsVariantProps = {
    form: UseFormReturn<any>;
    index: number;
};

const SLOT_TYPE_OPTIONS = [
    { value: 'creature', label: 'Creature' },
    { value: 'reinforcement', label: 'Reinforcement Creature' },
    { value: 'narrative', label: 'Narrative Event' },
    { value: 'aura', label: 'Aura Event' },
];

export function EncounterSlotFields({
    fields,
    form,
    remove,
}: EncounterSlotFieldsProps) {

    return (
        <div>
            {fields.map((field, index) => {
                // Get slotType from form values
                const slotType = form.getValues(`slots.${index}.type`) || 'creature';
                return (
                    <div key={field.id} className="flex gap-2 items-start mb-2 flex-wrap">
                        <SlotSelectField
                            form={form}
                            index={index}
                            options={SLOT_TYPE_OPTIONS}
                            placeholder="Select type..."
                            name={(idx: number) => `slots.${idx}.type`}
                            label="Slot Type"
                        />
                        {slotType === 'creature' && (
                            <EncounterSlotFieldsCreature control={form.control} index={index} />
                        )}
                        {slotType === 'reinforcement' && (
                            <EncounterSlotFieldsReinforcement control={form.control} index={index} />
                        )}
                        {slotType === 'narrative' && (
                            <EncounterSlotFieldsNarrative control={form.control} index={index} />
                        )}
                        {slotType === 'aura' && (
                            <EncounterSlotFieldsAura form={form} index={index} />
                        )}
                        <div className="flex-1 min-w-[80px]">
                            <FormItem>
                                <FormLabel>&nbsp;</FormLabel>
                                <FormControl>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        Remove
                                    </Button>
                                </FormControl>
                            </FormItem>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
