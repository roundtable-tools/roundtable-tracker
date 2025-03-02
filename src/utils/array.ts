/**
 * Splits an array into two arrays based on a predicate function.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} array - The array to be split.
 * @param {(item: T) => boolean} predicate - A function that determines which array an item belongs to.
 * @returns {[T[], T[]]} A tuple containing two arrays: the first with elements that satisfy the predicate, and the second with elements that do not.
 */
export const splitArray = <T>(array: T[], predicate: (item: T) => boolean) => {
	const left: T[] = [];
	const right: T[] = [];

	for (const item of array) {
		if (predicate(item)) {
			left.push(item);
		} else {
			right.push(item);
		}
	}

	return [left, right] as const;
};
