import { FormItem, FormLabel, FormControl, FormField } from "@/components/ui/form";
import { EncounterSlotFieldsVariantProps } from "./EncounterSlotFields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SlotSelectFieldProps extends EncounterSlotFieldsVariantProps {
    options: { value: string; label: string }[];
    placeholder: string;
    label: string;
    name: (index: number) => string;
}

export function SlotSelectField({form, label, index, options, placeholder, name}: SlotSelectFieldProps) {
    return <div className="flex-1 min-w-[100px]">
        <FormField control={form.control} name={name(index)} render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>
            </FormItem>
        )} />
    </div>;
}