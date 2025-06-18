import { InputField } from '../InputField';
import { FormItem, FormLabel, FormControl } from '../../ui/form';

const SIDE_OPTIONS = [
    { value: 'enemy', label: 'Enemy' },
    { value: 'ally', label: 'Ally' },
    { value: 'neutral', label: 'Neutral' },
];

export function EncounterSlotFieldsCreature({ control, index }: { control: any, index: number }) {
    return (
        <>
            <div className="flex-2 min-w-[120px]">
                <FormItem>
                    <FormLabel>Side</FormLabel>
                    <FormControl>
                        <select
                            className="border rounded px-2 py-1 w-full"
                            {...control.register(`slots.${index}.side`)}
                        >
                            {SIDE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormControl>
                </FormItem>
            </div>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={control}
                    name={`slots.${index}.name`}
                    label="Slot Name"
                    placeholder="Goblin"
                />
            </div>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={control}
                    name={`slots.${index}.description`}
                    label="Slot Description"
                    placeholder="A sneaky goblin"
                />
            </div>
        </>
    );
}