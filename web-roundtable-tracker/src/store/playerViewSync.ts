import { useSyncExternalStore } from 'react';
import { type EncounterStore } from './encounterRuntimeStore';
import { isSetJSON } from './serializer';

/** The parts of the GM's encounter that the player view shows. */
export type PlayerViewSnapshot = Pick<
	EncounterStore,
	| 'encounterData'
	| 'charactersMap'
	| 'charactersOrder'
	| 'delayedOrder'
	| 'trackerMetaMap'
	| 'partyLevel'
	| 'round'
	| 'charactersWithTurn'
	| 'timer'
>;

/**
 * Read-only feed of the GM's encounter for the player view. A channel never
 * writes anything back, so the player view cannot change the encounter.
 *
 * The local channel is published by the tracker's persisted store, which
 * writes every change to localStorage. A remote channel (online rooms) can
 * implement the same interface.
 */
export type PlayerViewChannel = {
	/** The latest snapshot, or null when no encounter is stored. Returns the same object until the encounter changes. */
	getSnapshot: () => PlayerViewSnapshot | null;
	/** Calls the listener after each change. Returns a function that unsubscribes. */
	subscribe: (listener: () => void) => () => void;
};

/** Storage key of the tracker's persisted encounter store. */
export const ENCOUNTER_STORE_KEY = 'encounter-store';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Each field the player view reads is either missing or of its stored type. */
const isStoredStateShape = (state: unknown): state is Partial<EncounterStore> =>
	isRecord(state) &&
	(state.encounterData === undefined || isRecord(state.encounterData)) &&
	(state.charactersMap === undefined || isRecord(state.charactersMap)) &&
	(state.charactersOrder === undefined ||
		isStringArray(state.charactersOrder)) &&
	(state.delayedOrder === undefined || isStringArray(state.delayedOrder)) &&
	(state.trackerMetaMap === undefined || isRecord(state.trackerMetaMap)) &&
	(state.partyLevel === undefined || typeof state.partyLevel === 'number') &&
	(state.round === undefined || typeof state.round === 'number') &&
	(state.charactersWithTurn === undefined ||
		state.charactersWithTurn instanceof Set);

/**
 * Builds a snapshot from the persisted encounter store JSON. Returns null for
 * a missing or unreadable value. Stored commands are left as plain JSON,
 * since the player view doesn't use the history.
 */
export const parsePlayerViewSnapshot = (
	json: string | null
): PlayerViewSnapshot | null => {
	if (!json) return null;

	let parsed: { state?: unknown } | null;

	try {
		parsed = JSON.parse(json, (_key, value) =>
			value && typeof value === 'object' && isSetJSON(value)
				? new Set(value.data)
				: value
		);
	} catch {
		return null;
	}

	const state = parsed?.state;

	if (!isStoredStateShape(state)) return null;

	return {
		encounterData: state.encounterData,
		charactersMap: state.charactersMap ?? {},
		charactersOrder: state.charactersOrder ?? [],
		delayedOrder: state.delayedOrder ?? [],
		trackerMetaMap: state.trackerMetaMap ?? {},
		partyLevel: state.partyLevel ?? 1,
		round: state.round ?? 0,
		charactersWithTurn: state.charactersWithTurn ?? new Set(),
		timer: state.timer ?? null,
	};
};

/** True when the snapshot holds an encounter with participants in initiative. */
export const isEncounterRunning = (
	snapshot: PlayerViewSnapshot | null
): snapshot is PlayerViewSnapshot =>
	snapshot !== null &&
	Boolean(snapshot.encounterData) &&
	(snapshot.charactersOrder.length > 0 || snapshot.delayedOrder.length > 0);

/**
 * Follows the tracker in another window or tab of the same browser. The
 * browser fires `storage` events only in the other windows, so a change
 * reaches the player window as soon as the tracker saves it.
 */
export const createLocalPlayerViewChannel = (
	getStorage: () => Storage = () => localStorage,
	target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window
): PlayerViewChannel => {
	let lastJson: string | null = null;
	let lastSnapshot: PlayerViewSnapshot | null = null;

	// The browser throws when site data is blocked; the player view then
	// waits as if nothing were stored.
	const readStoredJson = () => {
		try {
			return getStorage().getItem(ENCOUNTER_STORE_KEY);
		} catch {
			return null;
		}
	};

	return {
		getSnapshot: () => {
			const json = readStoredJson();

			if (json !== lastJson) {
				lastJson = json;
				lastSnapshot = parsePlayerViewSnapshot(json);
			}

			return lastSnapshot;
		},
		subscribe: (listener) => {
			const onStorage = (event: StorageEvent) => {
				// A null key means the whole storage was cleared.
				if (event.key === ENCOUNTER_STORE_KEY || event.key === null) {
					listener();
				}
			};

			target.addEventListener('storage', onStorage);

			return () => target.removeEventListener('storage', onStorage);
		},
	};
};

let playerViewChannel: PlayerViewChannel | null = null;

export const getPlayerViewChannel = () => {
	if (playerViewChannel === null) {
		playerViewChannel = createLocalPlayerViewChannel();
	}

	return playerViewChannel;
};

/** The GM's current encounter as the player view sees it, kept up to date. */
export const usePlayerViewSnapshot = (
	channel: PlayerViewChannel = getPlayerViewChannel()
) => useSyncExternalStore(channel.subscribe, channel.getSnapshot);
