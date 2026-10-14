import { indexToLetter } from '@/store/data';

const letterSuffix = (index: number) => indexToLetter(index).toUpperCase();

const hasLetteredCopy = (name: string, takenNames: string[]) =>
	takenNames.some(
		(taken) =>
			taken.length === name.length + 2 &&
			taken.startsWith(`${name} `) &&
			/[A-Z]$/.test(taken)
	);

/**
 * Makes `names` unique among themselves and against `takenNames`, which are
 * never renamed. A name used more than once, or one that already has lettered
 * copies among the taken names ("Bandit A"), gets a letter suffix (A, B, C…)
 * on each use, skipping letters that are already taken.
 */
export const uniqueNames = (
	names: string[],
	takenNames: string[] = []
): string[] => {
	const nameCounts = new Map<string, number>();

	for (const name of [...takenNames, ...names]) {
		nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
	}

	const taken = new Set(nameCounts.keys());
	const nextLetterIndex = new Map<string, number>();

	return names.map((name) => {
		if ((nameCounts.get(name) ?? 0) < 2 && !hasLetteredCopy(name, takenNames)) {
			return name;
		}

		let index = nextLetterIndex.get(name) ?? 0;
		let uniqueName = `${name} ${letterSuffix(index)}`;

		while (taken.has(uniqueName)) {
			index += 1;
			uniqueName = `${name} ${letterSuffix(index)}`;
		}

		nextLetterIndex.set(name, index + 1);
		taken.add(uniqueName);

		return uniqueName;
	});
};
