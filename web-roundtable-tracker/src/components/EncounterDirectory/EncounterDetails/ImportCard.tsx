import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Encounter } from '@/store/data';
import { useState } from 'react';
import { validateImportedEncounter } from './importEncounter';

type ImportCardProps = {
	submit: (encounterData: Encounter) => void;
	close: () => void;
};

export const ImportCard = (props: ImportCardProps) => {
	const { submit, close } = props;
	const [value, setValue] = useState(
		JSON.stringify(
			{
				name: 'Imported Encounter',
				description: 'Imported Encounter',
				difficulty: 0,
				level: 1,
				partySize: 4,
				participants: [],
			},
			null,
			2
		)
	);
	const [error, setError] = useState<string | null>(null);

	return (
		<Card className="gap-0 rounded-none border-0 shadow-none">
			<CardHeader className="border-b pb-6">
				<CardTitle className="text-2xl">Import Encounter</CardTitle>
				<CardDescription>
					Paste exported encounter JSON to validate it before loading.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 py-6">
				<Textarea
					placeholder="Paste JSON data here"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					className="min-h-72 font-mono text-xs leading-5"
				/>
				{error ? (
					<p className="whitespace-pre-wrap break-words rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{error}
					</p>
				) : null}
			</CardContent>
			<CardFooter className="justify-end gap-2 border-t pt-6">
				<Button variant="outline" onClick={close}>
					Back
				</Button>
				<Button
					onClick={() => {
						const [encounterData, validationError] =
							validateImportedEncounter(value);

						if (encounterData) {
							setError(null);
							submit(encounterData);
						} else {
							setError(validationError);
						}
					}}
				>
					Validate
				</Button>
			</CardFooter>
		</Card>
	);
};
