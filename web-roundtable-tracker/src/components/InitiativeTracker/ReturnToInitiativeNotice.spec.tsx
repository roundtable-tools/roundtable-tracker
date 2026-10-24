import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReturnToInitiativeNotice } from './ReturnToInitiativeNotice';

describe('ReturnToInitiativeNotice', () => {
	const markup = renderToStaticMarkup(
		createElement(ReturnToInitiativeNotice, {
			participants: [
				{ id: 'sneak', name: 'Goblin Sneak', distance: 0 },
				{ id: 'keeper', name: 'Bridge Keeper', distance: 2 },
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

	it('shows the distance from each old spot', () => {
		expect(markup).toContain('> (0)</span>');
		expect(markup).toContain('> (2)</span>');
	});

	it('closes with an icon button instead of a Nobody returns button', () => {
		expect(markup).not.toContain('>Nobody returns<');
		expect(markup).toContain('aria-label="Nobody returns"');
	});

	it('shows the countdown before nobody returns', () => {
		expect(markup).toContain('data-slot="notice-countdown"');
	});
});
