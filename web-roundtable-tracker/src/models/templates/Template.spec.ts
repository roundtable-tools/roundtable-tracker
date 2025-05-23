import { describe, it, expect } from 'vitest';
import { EncounterTemplate } from './EncounterTemplate.class';
import { TemplateComposite } from './TemplateComposite.class';
import { TemplateSlot } from './TemplateSlot.class';
import { TemplateEvent } from './TemplateEvent.class';
import { Threat } from '../utility/threat/Threat.class';
import { LevelDifference } from '../utility/level/LevelDifference';

describe('EncounterTemplate', () => {
    it('should construct with correct properties', () => {
        const slot = new TemplateSlot({
            name: 'Goblin',
            description: 'A sneaky goblin',
            offset: new LevelDifference(0)
        });
        const template = new EncounterTemplate({
            name: 'Goblin Ambush',
            description: 'A group of goblins attacks.',
            slots: [slot],
            partySize: 4
        });
        expect(template.name).toBe('Goblin Ambush');
        expect(template.description).toBe('A group of goblins attacks.');
        expect(template.slots).toHaveLength(1);
        expect(template.partySize).toBe(4);
    });

    it('should compute experienceBudget and experienceAward', () => {
        const slot = new TemplateSlot({
            name: 'Orc',
            description: 'A strong orc',
            offset: new LevelDifference(2)
        });
        const template = new EncounterTemplate({
            name: 'Orc Encounter',
            description: 'A lone orc appears.',
            slots: [slot],
            partySize: 4
        });
        expect(template.experienceBudget.valueOf()).toBeGreaterThan(0);
        expect(template.experienceAward.valueOf()).toBeGreaterThan(0);
    });

    it('should compute threatLevel from experienceBudget', () => {
        const slot = new TemplateSlot({
            name: 'Dragon',
            description: 'A terrifying dragon',
            offset: new LevelDifference(10)
        });
        const template = new EncounterTemplate({
            name: 'Dragon Fight',
            description: 'Face a dragon!',
            slots: [slot],
            partySize: 4
        });
        expect(template.threatLevel).toBeInstanceOf(Threat);
        expect(template.threatLevel.toLabel()).toBe(Threat.Impossible.toLabel());
    });
});

describe('TemplateComposite', () => {
    it('should proxy properties from main variant', () => {
        const slot1 = new TemplateSlot({
            name: 'Wolf',
            description: 'A hungry wolf',
            offset: new LevelDifference(0)
        });
        const slot2 = new TemplateSlot({
            name: 'Bear',
            description: 'A big bear',
            offset: new LevelDifference(1)
        });
        const variant1 = new EncounterTemplate({
            name: 'Wolf Encounter',
            description: 'A lone wolf.',
            slots: [slot1],
            partySize: 4
        });
        const variant2 = new EncounterTemplate({
            name: 'Bear Encounter',
            description: 'A lone bear.',
            slots: [slot2],
            partySize: 4
        });
        const composite = new TemplateComposite({
            variants: [variant1, variant2],
            mainVariantIndex: 1
        });
        expect(composite.name).toBe('Bear Encounter');
        expect(composite.description).toBe('A lone bear.');
        expect(composite.slots[0].name).toBe('Bear');
        expect(composite.partySize).toBe(4);
        expect(composite.threatLevel).toBeInstanceOf(Threat);
        expect(composite.threatLevel.toLabel()).toBe(Threat.Severe.toLabel());
    });
});

describe('TemplateSlot', () => {
    it('should construct with correct properties', () => {
        const event = new TemplateEvent({ turn: 2, description: 'Reinforcements arrive' });
        const slot = new TemplateSlot({
            name: 'Minion',
            description: 'A weak minion',
            offset: new LevelDifference(-1),
            event
        });
        expect(slot.name).toBe('Minion');
        expect(slot.description).toBe('A weak minion');
        expect(slot.offset?.valueOf()).toBe(-1);
        expect(slot.event).toBe(event);
    });
});

describe('TemplateEvent', () => {
    it('should construct with correct properties', () => {
        const event = new TemplateEvent({ turn: 3, description: 'Trap triggers' });
        expect(event.turn).toBe(3);
        expect(event.description).toBe('Trap triggers');
    });
});