import { Card, CardBody, CardFooter, Button, Text, TextArea } from 'grommet';
import { ConcreteEncounterSchema, Encounter } from '@/store/data';
import { useState } from 'react';
import { z } from 'zod';
import { generateUUID } from '@/utils/uuid';

type ImportCardProps = {
	submit: (encounterData: Encounter) => void;
	close: () => void;
};

const ValidateEncounter = (dataString: string): [Encounter | null, string] => {
	try {
		const parsedData = {
			levelRepresentation: 1, // Default level representation to 1
			id: generateUUID(), // Generate a new UUID for the encounter
			...JSON.parse(dataString),
		}; // Parse the JSON string
		const validatedData = ConcreteEncounterSchema.parse(parsedData); // Validate against the schema

		return [validatedData, '']; // Return the validated data if successful
	} catch (error) {
		if (error instanceof SyntaxError) {
			return [null, 'Invalid JSON format.']; // Handle JSON parsing errors
		} else if (error instanceof z.ZodError) {
			return [
				null,
				`${error.errors.map((e) => `${e.path}: ${e.message}`).join(',\n')}`,
			]; // Handle schema validation errors
		}

		return [null, 'Unknown error occurred.'];
	}
};

export const ImportCard = (props: ImportCardProps) => {
	const { submit, close } = props;
	const [value, setValue] = useState(
		JSON.stringify({
			name: 'Imported Encounter',
			description: 'Imported Encounter',
			difficulty: 0,
			level: 1,
			partySize: 4,
			participants: [],
		})
	);
	const [error, setError] = useState<string | null>(null);

	return (
		<Card>
			<CardBody
				pad={{ vertical: 'large', horizontal: 'medium' }}
				background="light-1"
			>
				<Text size="xxlarge">Import Encounter</Text>
				<TextArea
					placeholder="Paste JSON data here"
					value={value}
					onChange={(event) => setValue(event.target.value)}
				/>
				<Text
					size="small"
					color="status-error"
					style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
				>
					{error ?? ''}
				</Text>
			</CardBody>
			<CardFooter pad="small" background="light-2" justify="end">
				<Button label="Back" onClick={close}></Button>
				<Button
					label="Validate"
					primary
					onClick={() => {
						const [encounterData, validationError] = ValidateEncounter(value);
						if (encounterData) {
							submit(encounterData); // Pass the validated encounter data to the parent
						} else {
							setError(validationError);
						}
					}}
				/>
			</CardFooter>
		</Card>
	);
};
