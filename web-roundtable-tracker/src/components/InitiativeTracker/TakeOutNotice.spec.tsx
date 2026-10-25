import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TakeOutNotice } from './TakeOutNotice';

const render = (props: Parameters<typeof TakeOutNotice>[0]) =>
	renderToStaticMarkup(createElement(TakeOutNotice, props));

describe('TakeOutNotice', () => {
	const noop = () => {};

	it('slays an opponent by default, offering K.O. with each value and both', () => {
		const markup = render({
			participant: {
				name: 'Clockwork Soldier',
				role: 'opponent',
				sideTheme: 'opponent',
			},
			effects: ['hp', 'checks'],
			onTakeOut: noop,
			onRemove: noop,
		});

		expect(markup).toContain('Slain?');
		expect(markup).toContain('aria-label="Slay"');
		expect(markup).toContain('>Knock Out</button>');
		expect(markup).toMatch(/text-muted-foreground[^>]*>Slay<\/button><\/div>/);
		expect(markup).toContain('>Knock Out and set HP to 0</button>');
		expect(markup).toContain('>Knock Out and fill the disable checks</button>');
		expect(markup).toContain(
			'>Knock Out and set HP to 0 and fill the disable checks</button>'
		);
	});

	it('knocks out a PC by default, offering Slay', () => {
		const markup = render({
			participant: { name: 'Kyra', role: 'pc', sideTheme: 'pc' },
			effects: ['hp'],
			onTakeOut: noop,
			onRemove: noop,
		});

		expect(markup).toContain('Knocked Out?');
		expect(markup).toContain('aria-label="Knock Out"');
		expect(markup).toContain('>Slay</button>');
		expect(markup).toMatch(
			/text-muted-foreground[^>]*>Knock Out<\/button><\/div>/
		);
		expect(markup).toContain('>Knock Out and set HP to 0</button>');
	});

	it('names a hazard Disable / Destroy and offers no value without one', () => {
		const markup = render({
			participant: {
				name: 'Poison Dart Gallery',
				role: 'hazard',
				sideTheme: 'opponent',
			},
			effects: [],
			onTakeOut: noop,
			onRemove: noop,
		});

		expect(markup).toContain('Destroyed?');
		expect(markup).toContain('aria-label="Destroy"');
		expect(markup).toContain('>Disable</button>');
		expect(markup).toMatch(
			/text-muted-foreground[^>]*>Destroy<\/button><\/div>/
		);
		expect(markup).not.toContain('Disable and');
	});
});
