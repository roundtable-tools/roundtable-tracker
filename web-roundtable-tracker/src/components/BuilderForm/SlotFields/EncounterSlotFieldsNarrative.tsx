import { InputField } from '../InputField';

export function EncounterSlotFieldsNarrative({ control, index }: { control: any, index: number }) {
    return (
        <>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={control}
                    name={`slots.${index}.name`}
                    label="Event Name"
                    placeholder="Event"
                />
            </div>
            <div className="flex-3 min-w-[120px]">
                <InputField
                    control={control}
                    name={`slots.${index}.description`}
                    label="Event Description"
                    placeholder="Describe the event..."
                />
            </div>
            <div className="flex-1 min-w-[80px]">
                <InputField
                    control={control}
                    name={`slots.${index}.eventRound`}
                    label="Round"
                    placeholder="1"
                    type="number"
                />
            </div>
        </>
    );
}