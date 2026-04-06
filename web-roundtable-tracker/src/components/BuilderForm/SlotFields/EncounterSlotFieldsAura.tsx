import { InputField } from '../InputField';
import { EncounterSlotFieldsVariantProps } from './EncounterSlotFields';
import { SlotSelectField } from './SlotSelectField';

const SIDE_OPTIONS = [
    { value: 'enemy', label: 'Enemy' },
    { value: 'ally', label: 'Ally' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'any', label: 'Any' },
];

export function EncounterSlotFieldsAura({ form, index }: EncounterSlotFieldsVariantProps) {
    return (
        <>
            {SlotSelectField({form, index, options: SIDE_OPTIONS, placeholder: "Aura Type", name: (i: number) => `slots.${i}.side`, label: "Aura Type"})}
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={form.control}
                    name={`slots.${index}.name`}
                    label="Aura Name"
                    placeholder="Aura of Fear"
                />
            </div>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={form.control}
                    name={`slots.${index}.description`}
                    label="Aura Effect"
                    placeholder="Describe the effect..."
                />
            </div>
            <div className="flex-1 min-w-[80px]">
                <InputField
                    control={form.control}
                    name={`slots.${index}.auraCycle`}
                    label="Cycle (Rounds)"
                    placeholder="Every X rounds"
                    type="number"
                />
            </div>
        </>
    );
}
