import { describe, expect, it } from 'vitest';
import encounterTemplates from '@/models/encounters/defaultTemplates';
import { EncounterTemplateDataSchema } from '@/models/encounters/encounter.schemas';

describe('migratedEncounterTemplates', () => {
	it('exports schema-valid template data', () => {
		expect(encounterTemplates.length).toBeGreaterThan(0);

		for (const template of encounterTemplates) {
			expect(() => EncounterTemplateDataSchema.parse(template)).not.toThrow();
		}
	});

	it('keeps defaultVariantId aligned to an existing variant', () => {
		for (const template of encounterTemplates) {
			expect(
				template.variants.some((variant) => variant.id === template.defaultVariantId)
			).toBe(true);
		}
	});
});
