import type { ConcreteEncounter } from './data';
import { generateUUID } from '@/utils/uuid';

const importedEncounterDrafts = new Map<string, ConcreteEncounter>();

export function saveImportedEncounterDraft(
	encounter: ConcreteEncounter
): string {
	const draftId = generateUUID();

	importedEncounterDrafts.set(draftId, encounter);

	return draftId;
}

export function getImportedEncounterDraft(
	draftId: string
): ConcreteEncounter | undefined {
	return importedEncounterDrafts.get(draftId);
}

export function deleteImportedEncounterDraft(draftId: string): void {
	importedEncounterDrafts.delete(draftId);
}
