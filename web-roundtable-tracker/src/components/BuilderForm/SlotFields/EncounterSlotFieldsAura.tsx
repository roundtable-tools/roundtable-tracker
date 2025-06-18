import { InputField } from '../InputField';
import { FormItem, FormLabel, FormControl } from '../../ui/form';

const SIDE_OPTIONS = [
    { value: 'enemy', label: 'Enemy' },
    { value: 'ally', label: 'Ally' },
    { value: 'neutral', label: 'Neutral' },
];

export function EncounterSlotFieldsAura({ control, index }: { control: any, index: number }) {
    return (
        <>
            <div className="flex-1 min-w-[100px]">
                <FormItem>
                    <FormLabel>Target</FormLabel>
                    <FormControl>
                        <select
                            className="border rounded px-2 py-1 w-full"
                            {...control.register(`slots.${index}.auraTarget`)}
                        >
                            <option value="everyone">Everyone</option>
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
                    label="Aura Name"
                    placeholder="Aura of Fear"
                />
            </div>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={control}
                    name={`slots.${index}.description`}
                    label="Aura Effect"
                    placeholder="Describe the effect..."
                />
            </div>
            <div className="flex-1 min-w-[80px]">
                <InputField
                    control={control}
                    name={`slots.${index}.auraCycle`}
                    label="Cycle (Rounds)"
                    placeholder="Every X rounds"
                    type="number"
                />
            </div>
        </>
    );
}