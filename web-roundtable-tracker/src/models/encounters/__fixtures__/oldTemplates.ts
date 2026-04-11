import { EncounterTemplate as OldStoreTemplate } from '@/store/data';
import { ALIGNMENT, DIFFICULTY, LEVEL_REPRESENTATION, PRIORITY } from '@/store/data';

/**
 * Fixture 1: Simple single-variant template (one boss + lackeys)
 * Tests: Basic transformation, role inference
 */
export const simpleTemplateFixture: OldStoreTemplate = {
  id: 'old-simple-001',
  name: 'Boss and Lackeys',
  description: 'A boss surrounded by minions',
  levelRepresentation: LEVEL_REPRESENTATION.Relative,
  partySize: 4,
  difficulty: DIFFICULTY.Severe,
  difficultyLabel: 'Severe',
  participants: [
    {
      name: 'Boss',
      type: 'creature',
      level: '+2',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
    },
    {
      name: 'Lackey',
      type: 'creature',
      level: '-4',
      side: ALIGNMENT.Opponents,
      count: 4,
      tiePriority: PRIORITY.NPC,
    },
  ],
};

/**
 * Fixture 2: Multi-variant template
 * Tests: Multiple variants per template, variant selection, partySize variation
 */
export const multiVariantTemplateFixture: OldStoreTemplate = {
  id: 'old-multi-002',
  name: 'Goblin Lair',
  description: 'Goblin ambush encounter',
  levelRepresentation: LEVEL_REPRESENTATION.Relative,
  partySize: 4,
  difficulty: DIFFICULTY.Moderate,
  participants: [
    {
      name: 'Goblin Boss',
      type: 'creature',
      level: '+1',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
    },
    {
      name: 'Goblin Warrior',
      type: 'creature',
      level: '+0',
      side: ALIGNMENT.Opponents,
      count: 3,
      tiePriority: PRIORITY.NPC,
    },
  ],
  variants: [
    {
      partySize: 3,
      description: 'Smaller party encounter',
      participants: [
        {
          name: 'Goblin Boss',
          type: 'creature',
          level: '+1',
          side: ALIGNMENT.Opponents,
          count: 1,
          tiePriority: PRIORITY.NPC,
        },
        {
          name: 'Goblin Warrior',
          type: 'creature',
          level: '+0',
          side: ALIGNMENT.Opponents,
          count: 2,
          tiePriority: PRIORITY.NPC,
        },
      ],
    },
    {
      partySize: 5,
      description: 'Larger party encounter',
      participants: [
        {
          name: 'Elite Goblin Boss',
          type: 'creature',
          level: '+2',
          side: ALIGNMENT.Opponents,
          count: 1,
          tiePriority: PRIORITY.NPC,
          adjustment: 'elite',
        },
        {
          name: 'Goblin Warrior',
          type: 'creature',
          level: '+0',
          side: ALIGNMENT.Opponents,
          count: 4,
          tiePriority: PRIORITY.NPC,
        },
      ],
    },
  ],
};

/**
 * Fixture 3: Hazard-heavy template
 * Tests: Hazard discrimination, complex vs simple, successesToDisable
 */
export const hazardTemplateFixture: OldStoreTemplate = {
  id: 'old-hazard-003',
  name: 'Trapped Tomb',
  description: 'A hazardous dungeon chamber',
  levelRepresentation: LEVEL_REPRESENTATION.Relative,
  partySize: 4,
  difficulty: DIFFICULTY.Moderate,
  participants: [
    {
      name: 'Fire Trap',
      type: 'hazard',
      level: '+1',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
      successesToDisable: 2,
      isComplexHazard: false,
    },
    {
      name: 'Ceiling Collapse',
      type: 'hazard',
      level: '+0',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
      successesToDisable: 3,
      isComplexHazard: true,
    },
    {
      name: 'Tomb Guardian',
      type: 'creature',
      level: '+1',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
    },
  ],
};

/**
 * Fixture 4: Template with narrative events + round triggers
 * Tests: NarrativeSlot → Event conversion, round/turnIndex mapping, reinforcements
 */
export const eventTemplateFixture: OldStoreTemplate = {
  id: 'old-event-004',
  name: 'Reinforcement Scenario',
  description: 'Encounter with mid-fight reinforcements',
  levelRepresentation: LEVEL_REPRESENTATION.Relative,
  partySize: 4,
  participants: [
    {
      name: 'Initial Boss',
      type: 'creature',
      level: '+1',
      side: ALIGNMENT.Opponents,
      count: 1,
      tiePriority: PRIORITY.NPC,
    },
  ],
  narrativeSlots: [
    {
      id: 'event-001',
      type: 'default',
      description: 'Boss taunts the party',
      trigger: { round: 1 },
    },
    {
      id: 'event-002',
      type: 'reinforcement',
      description: 'Allies arrive to help the boss',
      trigger: { round: 3 },
      participants: [
        {
          name: 'Minion',
          type: 'creature',
          level: '-2',
          side: ALIGNMENT.Opponents,
          count: 2,
          tiePriority: PRIORITY.NPC,
        },
      ],
    },
    {
      id: 'event-003',
      type: 'ongoing',
      description: 'Environmental hazard effect repeats',
      trigger: { round: 2, frequency: 2 },
    },
  ],
};

/**
 * Fixture 5: Edge case - missing/null fields
 * Tests: Defaults, optional handling, robustness
 */
export const edgeCaseTemplateFixture: OldStoreTemplate = {
  id: 'old-edge-005',
  name: 'Minimal Template',
  description: '',
  levelRepresentation: LEVEL_REPRESENTATION.Relative,
  participants: [
    {
      name: 'Mystery Opponent',
      type: 'creature',
      level: '+0',
      side: ALIGNMENT.Opponents,
      // count, tiePriority optional
    },
  ],
  // no partySize, variants, narrativeSlots
};

export const allFixtures = [
  simpleTemplateFixture,
  multiVariantTemplateFixture,
  hazardTemplateFixture,
  eventTemplateFixture,
  edgeCaseTemplateFixture,
];
