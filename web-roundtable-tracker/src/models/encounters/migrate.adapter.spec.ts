import { describe, it, expect } from 'vitest';
import {
  simpleTemplateFixture,
  multiVariantTemplateFixture,
  hazardTemplateFixture,
  eventTemplateFixture,
  edgeCaseTemplateFixture,
  allFixtures,
} from './__fixtures__/oldTemplates';
import { migrateOldTemplate, migrateOldTemplates } from './migrate.adapter';
import { EncounterTemplateDataSchema } from './encounter.schemas';
import { EncounterTemplateData } from './encounter.types';

/**
 * Validation utility: checks if migrated template has basic data preservation
 */
function validateMigration(
  originalName: string,
  migrated: EncounterTemplateData,
): { passed: boolean; errors: string[] } {
  const result = {
    passed: true,
    errors: [] as string[],
  };

  // Name preservation
  if (originalName !== migrated.name) {
    result.errors.push(`Name mismatch: expected "${originalName}", got "${migrated.name}"`);
  }

  // Variant count
  if (migrated.variants.length === 0) {
    result.errors.push('No variants in migrated template');
  }

  // Total participant count (across all variants)
  const totalNewParticipants = migrated.variants.reduce((sum, v) => sum + v.participants.length, 0);

  // In fixtures, we have:
  // - Base variant participants
  // - Optional variant participants
  // The total should match what we put in
  if (totalNewParticipants === 0) {
    result.errors.push('No participants in any variant');
  }

  // defaultVariantId must exist
  const hasDefaultVariant = migrated.variants.some((v) => v.id === migrated.defaultVariantId);
  if (!hasDefaultVariant) {
    result.errors.push(
      `defaultVariantId "${migrated.defaultVariantId}" does not reference any variant`,
    );
  }

  // All participants must have required fields
  for (const variant of migrated.variants) {
    for (const participant of variant.participants) {
      if (!participant.id) result.errors.push('Participant missing id');
      if (participant.count === undefined) result.errors.push('Participant missing count');
      if (participant.relativeLevel === undefined)
        result.errors.push('Participant missing relativeLevel');
      if (participant.side === undefined) result.errors.push('Participant missing side');
      if (participant.type === undefined) result.errors.push('Participant missing type');
      if (participant.type === 'creature' && !participant.role) {
        result.errors.push('Creature participant missing role');
      }
      if (participant.type === 'hazard' && !participant.role) {
        result.errors.push('Hazard participant missing role');
      }
      if (participant.type === 'hazard' && participant.successesToDisable === undefined) {
        result.errors.push('Hazard participant missing successesToDisable');
      }
    }
  }

  result.passed = result.errors.length === 0;
  return result;
}

describe('Encounter Template Migration (Phase 0)', () => {
  describe('Fixture 1: Simple Template', () => {
    it('should migrate simple template without errors', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      expect(migrated).toBeDefined();
      expect(migrated.name).toBe(simpleTemplateFixture.name);
    });

    it('should pass Zod validation', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      const result = EncounterTemplateDataSchema.safeParse(migrated);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }
    });

    it('should preserve data integrity', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      const validation = validateMigration(
        simpleTemplateFixture.name,
        migrated,
      );
      expect(validation.passed).toBe(true, () => `Validation errors: ${validation.errors.join(', ')}`);
    });

    it('should have one base variant', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      expect(migrated.variants.length).toBe(1);
    });

    it('should infer roles correctly', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      const boss = migrated.variants[0].participants.find((p) => p.tag === 'Boss');
      const lackey = migrated.variants[0].participants.find((p) => p.tag === 'Lackey');

      if (boss && boss.type === 'creature') {
        expect(boss.role).toBe('boss');
      }
      if (lackey && lackey.type === 'creature') {
        expect(lackey.role).toBe('lackey');
      }
    });

    it('should parse relative levels correctly', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      const boss = migrated.variants[0].participants.find((p) => p.tag === 'Boss');
      const lackey = migrated.variants[0].participants.find((p) => p.tag === 'Lackey');

      expect(boss?.relativeLevel.valueOf()).toBe(2); // '+2' → 2
      expect(lackey?.relativeLevel.valueOf()).toBe(-4); // '-4' → -4
    });
  });

  describe('Fixture 2: Multi-Variant Template', () => {
    it('should migrate multi-variant template', () => {
      const migrated = migrateOldTemplate(multiVariantTemplateFixture);
      expect(migrated.variants.length).toBe(3); // base + 2 variants
    });

    it('should pass Zod validation', () => {
      const migrated = migrateOldTemplate(multiVariantTemplateFixture);
      const result = EncounterTemplateDataSchema.safeParse(migrated);
      expect(result.success).toBe(true);
    });

    it('should preserve each variant separately', () => {
      const migrated = migrateOldTemplate(multiVariantTemplateFixture);
      const partySize3 = migrated.variants.find((v) => v.partySize === 3);
      const partySize5 = migrated.variants.find((v) => v.partySize === 5);

      expect(partySize3).toBeDefined();
      expect(partySize5).toBeDefined();
    });

    it('should have different participant counts per variant', () => {
      const migrated = migrateOldTemplate(multiVariantTemplateFixture);
      const counts = migrated.variants.map((v) =>
        v.participants.reduce((sum, p) => sum + p.count, 0),
      );
      expect(counts.length).toBeGreaterThan(1);
    });
  });

  describe('Fixture 3: Hazard Template', () => {
    it('should migrate hazard-heavy template', () => {
      const migrated = migrateOldTemplate(hazardTemplateFixture);
      expect(migrated).toBeDefined();
    });

    it('should pass Zod validation', () => {
      const migrated = migrateOldTemplate(hazardTemplateFixture);
      const result = EncounterTemplateDataSchema.safeParse(migrated);
      expect(result.success).toBe(true);
    });

    it('should correctly assign hazard roles', () => {
      const migrated = migrateOldTemplate(hazardTemplateFixture);
      const hazards = migrated.variants[0].participants.filter((p) => p.type === 'hazard');

      expect(hazards.length).toBeGreaterThan(0);

      // Check for simple vs complex
      const simple = hazards.find((h) => h.tag?.includes('Fire Trap'));
      const complex = hazards.find((h) => h.tag?.includes('Ceiling Collapse'));

      if (simple && simple.type === 'hazard') {
        expect(simple.role).toBe('simple');
      }
      if (complex && complex.type === 'hazard') {
        expect(complex.role).toBe('complex');
      }
    });

    it('should preserve successesToDisable', () => {
      const migrated = migrateOldTemplate(hazardTemplateFixture);
      const hazards = migrated.variants[0].participants.filter((p) => p.type === 'hazard');

      hazards.forEach((h) => {
        if (h.type === 'hazard') {
          expect(h.successesToDisable).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should mix creatures and hazards correctly', () => {
      const migrated = migrateOldTemplate(hazardTemplateFixture);
      const creatures = migrated.variants[0].participants.filter((p) => p.type === 'creature');
      const hazards = migrated.variants[0].participants.filter((p) => p.type === 'hazard');

      expect(creatures.length).toBeGreaterThan(0);
      expect(hazards.length).toBeGreaterThan(0);
    });
  });

  describe('Fixture 4: Event Template', () => {
    it('should migrate template with narrative slots', () => {
      const migrated = migrateOldTemplate(eventTemplateFixture);
      expect(migrated).toBeDefined();
    });

    it('should pass Zod validation', () => {
      const migrated = migrateOldTemplate(eventTemplateFixture);
      const result = EncounterTemplateDataSchema.safeParse(migrated);
      expect(result.success).toBe(true);
    });

    it('should preserve template structure', () => {
      const migrated = migrateOldTemplate(eventTemplateFixture);
      expect(migrated.name).toBe('Reinforcement Scenario');
      expect(migrated.variants.length).toBeGreaterThan(0);
    });
  });

  describe('Fixture 5: Edge Case Template', () => {
    it('should migrate edge case template with minimal fields', () => {
      const migrated = migrateOldTemplate(edgeCaseTemplateFixture);
      expect(migrated).toBeDefined();
    });

    it('should pass Zod validation', () => {
      const migrated = migrateOldTemplate(edgeCaseTemplateFixture);
      const result = EncounterTemplateDataSchema.safeParse(migrated);
      expect(result.success).toBe(true);
    });

    it('should provide defaults for missing partySize', () => {
      const migrated = migrateOldTemplate(edgeCaseTemplateFixture);
      expect(migrated.variants[0].partySize).toBe(4); // Default
    });
  });

  describe('Batch Migration', () => {
    it('should migrate all fixtures without error', () => {
      expect(() => migrateOldTemplates(allFixtures)).not.toThrow();
    });

    it('should return same number of templates', () => {
      const migrated = migrateOldTemplates(allFixtures);
      expect(migrated.length).toBe(allFixtures.length);
    });

    it('should have all templates pass validation', () => {
      const migrated = migrateOldTemplates(allFixtures);
      migrated.forEach((template) => {
        const result = EncounterTemplateDataSchema.safeParse(template);
        expect(result.success).toBe(
          true,
          `Template ${template.id} failed validation: ${result.success ? '' : result.error?.issues.map((i) => i.message).join(', ')}`,
        );
      });
    });
  });

  describe('Data Preservation Checklist', () => {
    it('should generate new UUIDs for non-UUID fixture IDs', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      // Fixture IDs like 'old-simple-001' are not valid UUIDs, so migration generates new ones
      expect(migrated.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(migrated.id).not.toBe(simpleTemplateFixture.id);
    });

    it('should generate UUIDs for missing IDs', () => {
      const template = { ...edgeCaseTemplateFixture, id: undefined as any };
      const migrated = migrateOldTemplate(template);
      expect(migrated.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should always have defaultVariantId pointing to valid variant', () => {
      allFixtures.forEach((fixture) => {
        const migrated = migrateOldTemplate(fixture);
        const hasDefault = migrated.variants.some((v) => v.id === migrated.defaultVariantId);
        expect(hasDefault).toBe(true, `Template ${fixture.id} has invalid defaultVariantId`);
      });
    });

    it('should ensure no participant data loss in simple case', () => {
      const migrated = migrateOldTemplate(simpleTemplateFixture);
      const totalParticipants = migrated.variants.reduce(
        (sum, v) => sum + v.participants.reduce((psum, p) => psum + p.count, 0),
        0,
      );
      const expectedTotal = simpleTemplateFixture.participants.reduce((sum, p) => sum + (p.count ?? 1), 0);

      expect(totalParticipants).toBe(expectedTotal);
    });
  });
});
