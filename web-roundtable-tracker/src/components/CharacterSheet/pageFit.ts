// The A4 content box is 283 mm tall. The spells go on the exploration page
// only when this much of it is left below the cards and descriptions.
export const SPELLS_MIN_MM = 120;
const PAGE_CONTENT_MM = 283;

// Measured by the exploration page (its id + "-content").
export const EXPLORATION_CONTENT_ID = 'exploration-actions-content';

export const spellsFitOnExploration = (counts: Record<string, number>) =>
	PAGE_CONTENT_MM - (counts[EXPLORATION_CONTENT_ID] ?? 0) >= SPELLS_MIN_MM;
