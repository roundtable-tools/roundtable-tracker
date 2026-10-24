import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BringBackNotice } from './BringBackNotice';

const render = (props: Parameters<typeof BringBackNotice>[0]) =>
	renderToStaticMarkup(createElement(BringBackNotice, props));

describe('BringBackNotice', () => {
	const noop = () => {};

	it('asks whether a healed creature with full checks stays knocked out, by default', () => {
		const markup = render({
			participant: { name: 'Clockwork Soldier', role: 'opponent' },
			reason: 'hp',
			stillOut: ['checks'],
			onStayOut: noop,
			onReactivate: noop,
		});

		expect(markup).toContain('Still Knocked Out?');
		expect(markup).toContain(
			'Clockwork Soldier is above 0 HP, but its disable checks are full. Reactivate takes one disable check off.'
		);
		expect(markup).toContain('>Stay Knocked Out</button>');
		expect(markup).toContain('>Reactivate</button>');
		expect(markup).toContain('aria-label="Stay Knocked Out"');
	});

	it('names the hazard state and the 0 HP left behind', () => {
		const markup = render({
			participant: { name: 'Clockwork Trap', role: 'hazard' },
			reason: 'checks',
			stillOut: ['hp'],
			onStayOut: noop,
			onReactivate: noop,
		});

		expect(markup).toContain('Still Disabled?');
		expect(markup).toContain(
			'Clockwork Trap has disable checks left, but it is at 0 HP. Reactivate sets HP to 1.'
		);
		expect(markup).toContain('aria-label="Stay Disabled"');
	});
});
