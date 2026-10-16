import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResumeTimerNotice } from './ResumeTimerNotice';

describe('ResumeTimerNotice', () => {
	const markup = renderToStaticMarkup(
		createElement(ResumeTimerNotice, {
			onStayPaused: () => {},
			onResume: () => {},
		})
	);

	it('offers only Stay paused; closing resumes the timer', () => {
		expect(markup.match(/<button/g)).toHaveLength(2);
		expect(markup).toContain('>Stay paused</button>');
		expect(markup).toContain('aria-label="Resume timer"');
	});

	it('counts down to resuming', () => {
		expect(markup).toContain('data-slot="notice-countdown"');
	});
});
