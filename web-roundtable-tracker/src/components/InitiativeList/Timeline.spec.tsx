import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Timeline, type TimelineEvent } from './Timeline';

const render = (events: TimelineEvent[]) =>
	renderToStaticMarkup(
		createElement(Timeline, { currentTurn: 2, events, futureTurns: 3 })
	);

const count = (markup: string, slot: string) =>
	markup.split(`data-slot="${slot}"`).length - 1;

describe('Timeline', () => {
	it('marks a round with an event still to trigger with a dot', () => {
		const markup = render([
			{ round: 3, label: 'Reinforcement', actionLabel: 'Trigger Now' },
		]);

		expect(count(markup, 'timeline-event-dot')).toBe(1);
	});

	it('shows no dot once the event is triggered', () => {
		const markup = render([
			{
				round: 2,
				label: 'Reinforcement',
				actionLabel: 'Triggered',
				actionDisabled: true,
			},
		]);

		expect(count(markup, 'timeline-event-dot')).toBe(0);
	});

	it('fills the count of several events in amber while any is pending', () => {
		const pending = render([
			{ round: 4, label: 'Ongoing' },
			{ round: 4, label: 'Reinforcement', actionDisabled: true },
		]);
		const done = render([
			{ round: 4, label: 'Reinforcement', actionDisabled: true },
			{ round: 4, label: 'Reinforcement', actionDisabled: true },
		]);

		expect(count(pending, 'timeline-event-count')).toBe(1);
		expect(count(pending, 'timeline-event-dot')).toBe(0);
		expect(pending).toContain('bg-amber-400');
		expect(count(done, 'timeline-event-count')).toBe(1);
		expect(done).not.toContain('bg-amber-400');
		expect(pending).toContain('aria-label="2 events, some to trigger"');
		expect(done).toContain('aria-label="2 events, all triggered"');
	});
});
