import { ENCOUNTER_STORE_KEY } from '@/store/playerViewSync';

// The files in examples/tracker-states/, keyed by name without extension.
const examples = Object.fromEntries(
	Object.entries(
		import.meta.glob<string>('../examples/tracker-states/*.json', {
			query: '?raw',
			import: 'default',
		})
	).map(([path, load]) => [
		path.replace(/^.*\//, '').replace(/\.json$/, ''),
		load,
	])
);

export const trackerExampleNames = Object.keys(examples);

/** The page URL that loads an example into the tracker. */
export const trackerExampleUrl = (name: string) =>
	`${import.meta.env.BASE_URL}?example=${encodeURIComponent(name)}#/initiative_tracker`;

/**
 * Dev server only: `?example=<name>` in the URL replaces the running
 * encounter with that example, then drops the parameter so a reload keeps
 * whatever the GM does next. Must run before the encounter store is created.
 */
export const loadTrackerExampleFromUrl = async () => {
	const url = new URL(window.location.href);
	const name = url.searchParams.get('example');

	if (!name) return;

	const load = examples[name];

	if (!load) {
		console.warn(
			`No tracker example "${name}". Examples: ${Object.keys(examples).join(', ')}`
		);

		return;
	}

	localStorage.setItem(ENCOUNTER_STORE_KEY, await load());
	url.searchParams.delete('example');
	window.history.replaceState(null, '', url);
};
