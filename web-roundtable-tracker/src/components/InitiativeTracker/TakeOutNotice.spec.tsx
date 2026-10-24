import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TakeOutNotice } from './TakeOutNotice';

const render = (props: Parameters<typeof TakeOutNotice>[0]) =>
	renderToStaticMarkup(createElement(TakeOutNotice, props));

describe('TakeOutNotice', () => {
	const noop = () => {};

	it('asks Knock Out or Slay for a creature at 0 HP, with Slain as the default', () => {
		const markup = render({
			participant: { name: 'Goblin Dog', role: 'opponent' },
			reason: 'hp',
			onTakeOut: noop,
			onRemove: noop,
		});

		expect(markup).toContain('Goblin Dog dropped to 0 HP.');
		expect(markup).toContain('>Knock Out</button>');
		expect(markup).toContain('>Slay</button>');
		expect(markup).toContain('aria-label="Slain"');
		expect(markup).toContain('data-slot="notice-countdown"');
	});

	it('asks Disable or Destroy for a hazard with full checks, with Destroyed as the default', () => {
		const markup = render({
			participant: { name: 'Swinging Log', role: 'hazard' },
			reason: 'checks',
			onTakeOut: noop,
			onRemove: noop,
		});

		expect(markup).toContain('Swinging Log has its disable checks full.');
		expect(markup).toContain('>Disable</button>');
		expect(markup).toContain('>Destroy</button>');
		expect(markup).toContain('aria-label="Destroyed"');
	});
});
