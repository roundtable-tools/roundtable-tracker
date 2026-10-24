import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BringBackNotice } from './BringBackNotice';

const render = (props: Parameters<typeof BringBackNotice>[0]) =>
	renderToStaticMarkup(createElement(BringBackNotice, props));

describe('BringBackNotice', () => {
	const noop = () => {};

	it('keeps a healed creature with full checks out by default, offering to set the checks back', () => {
		const markup = render({
			participant: {
				name: 'Clockwork Soldier',
				role: 'opponent',
				disableChecksRequired: 3,
			},
			reason: 'hp',
			stillOut: ['checks'],
			onStayOut: noop,
			onReactivate: noop,
		});

		expect(markup).toContain('Still Knocked Out?');
		expect(markup).toContain(
			'Clockwork Soldier is above 0 HP, but its disable checks are full.'
		);
		expect(markup).toContain(
			'>Also set disable checks to 2/3 and reactivate</button>'
		);
		expect(markup).not.toContain('>Keep Knocked Out</button>');
		expect(markup).toContain('aria-label="Keep Knocked Out"');
	});

	it('offers to set HP to 1 for a hazard left at 0 HP', () => {
		const markup = render({
			participant: {
				name: 'Clockwork Trap',
				role: 'hazard',
				disableChecksRequired: 2,
			},
			reason: 'checks',
			stillOut: ['hp'],
			onStayOut: noop,
			onReactivate: noop,
		});

		expect(markup).toContain('Still Disabled?');
		expect(markup).toContain(
			'Clockwork Trap has disable checks left, but it is at 0 HP.'
		);
		expect(markup).toContain('>Also set HP to 1 and reactivate</button>');
		expect(markup).toContain('aria-label="Keep Disabled"');
	});

	it('reactivates by default when nothing else keeps it out, offering to keep it out', () => {
		const markup = render({
			participant: {
				name: 'Clockwork Soldier',
				role: 'opponent',
				disableChecksRequired: 3,
			},
			reason: 'checks',
			stillOut: [],
			onStayOut: noop,
			onReactivate: noop,
		});

		expect(markup).toContain('Reactivate?');
		expect(markup).toContain('Clockwork Soldier has disable checks left.');
		expect(markup).toContain('>Keep Knocked Out</button>');
		expect(markup).toContain('aria-label="Reactivate"');
	});
});
