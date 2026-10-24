import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReturnToInitiativeNotice } from './ReturnToInitiativeNotice';

describe('ReturnToInitiativeNotice', () => {
	const markup = renderToStaticMarkup(
		createElement(ReturnToInitiativeNotice, {
			participants: [
				{ id: 'sneak', name: 'Goblin Sneak' },
				{ id: 'keeper', name: 'Bridge Keeper' },
			],
			onReturn: () => {},
			onDismiss: () => {},
		})
	);

	it('offers a Return button for each delaying participant', () => {
		expect(markup).toContain('Goblin Sneak');
		expect(markup).toContain('Bridge Keeper');
		expect(markup.match(/>Return<\/button>/g)).toHaveLength(2);
	});

	it('closes with an icon button instead of a Nobody returns button', () => {
		expect(markup).not.toContain('>Nobody returns<');
		expect(markup).toContain('aria-label="Nobody returns"');
	});

	it('marks the participant who comes back after this turn anyway', () => {
		const withReturning = renderToStaticMarkup(
			createElement(ReturnToInitiativeNotice, {
				participants: [
					{ id: 'sneak', name: 'Goblin Sneak' },
					{ id: 'keeper', name: 'Bridge Keeper' },
				],
				returningId: 'keeper',
				onReturn: () => {},
				onDismiss: () => {},
			})
		);

		expect(markup).not.toContain('after this turn anyway');
		expect(withReturning.match(/after this turn anyway/g)).toHaveLength(1);
	});

	it('shows the countdown before nobody returns', () => {
		expect(markup).toContain('data-slot="notice-countdown"');
	});
});
