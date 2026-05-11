import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	builderPageSpy: vi.fn(),
}));

vi.mock('@/components/BuilderPage/BuilderPage', () => ({
	BuilderPage: (props: { encounterId?: string; importDraftId?: string }) => {
		mocks.builderPageSpy(props);

		return createElement('main', { 'data-testid': 'builder-page' });
	},
}));

import { validateBuilderSearch } from '@/routes/builder';
import { BuilderRouteComponent, Route } from '@/routes/builder';

describe('builder route search params', () => {
	beforeEach(() => {
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
			importDraftId: 'draft-1',
		});

		expect(parsed.templateId).toBe('template-1');
		expect(parsed.encounterId).toBe('encounter-1');
		expect(parsed.importDraftId).toBe('draft-1');
	});

	it('rejects non-string values', () => {
		expect(() => validateBuilderSearch({ templateId: 42 })).toThrow();
		expect(() => validateBuilderSearch({ encounterId: true })).toThrow();
		expect(() => validateBuilderSearch({ importDraftId: 42 })).toThrow();
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

		expect(html).toContain('data-testid="builder-page"');
		expect(mocks.builderPageSpy).toHaveBeenCalledTimes(1);
	});

	it('passes route-specific props to BuilderPage', () => {
		renderToStaticMarkup(createElement(BuilderRouteComponent as ComponentType));

		const builderPageProps = mocks.builderPageSpy.mock.calls[0]?.[0] as {
			encounterId?: string;
			importDraftId?: string;
		};

		expect(builderPageProps?.encounterId).toBeUndefined();
		expect(builderPageProps?.importDraftId).toBeUndefined();
	});
});
