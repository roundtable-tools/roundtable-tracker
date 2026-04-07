import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	appHeaderSpy: vi.fn(),
	builderPageSpy: vi.fn(),
}));

vi.mock('@/AppHeader', () => ({
	AppHeader: (props: { setView: (view: string) => void }) => {
		mocks.appHeaderSpy(props);
		return createElement('div', { 'data-testid': 'app-header' });
	},
}));

vi.mock('@/components/BuilderPage/BuilderPage', () => ({
	BuilderPage: (props: { encounterId?: string }) => {
		mocks.builderPageSpy(props);
		return createElement('main', { 'data-testid': 'builder-page' });
	},
}));

import { validateBuilderSearch } from '@/routes/builder';
import { BuilderRouteComponent, Route } from '@/routes/builder';

describe('builder route search params', () => {
	beforeEach(() => {
		mocks.appHeaderSpy.mockClear();
		mocks.builderPageSpy.mockClear();
		vi.spyOn(Route, 'useSearch').mockReturnValue({});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('accepts empty search', () => {
		const parsed = validateBuilderSearch({});

		expect(parsed).toEqual({});
	});

	it('accepts templateId and encounterId', () => {
		const parsed = validateBuilderSearch({
			templateId: 'template-1',
			encounterId: 'encounter-1',
		});

		expect(parsed.templateId).toBe('template-1');
		expect(parsed.encounterId).toBe('encounter-1');
	});

	it('rejects non-string values', () => {
		expect(() => validateBuilderSearch({ templateId: 42 })).toThrow();
		expect(() => validateBuilderSearch({ encounterId: true })).toThrow();
	});

	it('drops unknown search keys', () => {
		const parsed = validateBuilderSearch({
			templateId: 'template-2',
			foo: 'bar',
		});

		expect(parsed).toEqual({ templateId: 'template-2' });
	});

	it('renders expected builder route UI elements', () => {
		const html = renderToStaticMarkup(
			createElement(BuilderRouteComponent as ComponentType)
		);

		expect(html).toContain('data-testid="app-header"');
		expect(html).toContain('data-testid="builder-page"');
		expect(mocks.appHeaderSpy).toHaveBeenCalledTimes(1);
		expect(mocks.builderPageSpy).toHaveBeenCalledTimes(1);
	});

	it('passes route-specific props to AppHeader and BuilderPage', () => {
		renderToStaticMarkup(createElement(BuilderRouteComponent as ComponentType));

		const appHeaderProps = mocks.appHeaderSpy.mock.calls[0]?.[0] as {
			setView: (view: string) => void;
		};
		const builderPageProps = mocks.builderPageSpy.mock.calls[0]?.[0] as {
			encounterId?: string;
		};

		expect(typeof appHeaderProps?.setView).toBe('function');
		expect(() => appHeaderProps.setView('any-view')).not.toThrow();
		expect(builderPageProps?.encounterId).toBeUndefined();
	});
});
