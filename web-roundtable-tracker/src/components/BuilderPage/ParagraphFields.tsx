import type { Control, FieldPathByValue } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BuilderFormValues } from './builderConvert';

interface ParagraphFieldsProps {
	control: Control<BuilderFormValues>;
	fieldNames: [BuilderStringFieldName, BuilderStringFieldName];
	label: string;
	placeholders: [string, string];
}

type BuilderStringFieldName = {
	[K in FieldPathByValue<BuilderFormValues, string>]: K;
}[FieldPathByValue<BuilderFormValues, string>];

export function ParagraphFields({
	control,
	label,
	fieldNames,
	placeholders,
}: ParagraphFieldsProps) {
	const [nameField, descriptionField] = fieldNames;
	const [namePlaceholder, descriptionPlaceholder] = placeholders;
	return (
		<div>
			<FormField
				control={control}
				name={nameField}
				render={({ field }) => (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Input
								placeholder={namePlaceholder}
								type="text"
								className="rounded-b-none"
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name={descriptionField}
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<Textarea
								className="min-h-[80px] rounded-t-none border-t-0"
								placeholder={descriptionPlaceholder}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}