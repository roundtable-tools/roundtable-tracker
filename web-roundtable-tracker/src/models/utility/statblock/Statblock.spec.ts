import { describe, it, expect } from 'vitest';
import { Statblock } from './Statblock.class';
import { Level } from '../level/Level';

describe('Statblock', () => {
    it('should construct with required level property', () => {
        const level = new Level(3);
        const statblock = new Statblock({ level });
        expect(statblock.level).toBe(level);
    });

    it('should assign all provided properties', () => {
        const level = new Level(5);
        const statblock = new Statblock({
            level,
            name: 'Goblin',
            rarity: 'common',
            size: 'small',
            traits: ['goblin', 'humanoid'],
            perception: { modifier: 5, specialSenses: ['darkvision'] },
            languages: ['Goblin', 'Common'],
            skills: { stealth: 7, athletics: 3 },
            attributes: { strength: 10, dexterity: 14 },
            items: ['shortsword'],
            interactionAbilities: ['taunt'],
            defenses: {
                ac: 16,
                savingThrows: { fortitude: 4, reflex: 6, will: 2 },
                hp: 20,
                immunities: ['poison'],
                weaknesses: ['fire'],
                resistances: ['cold']
            },
            automaticAbilities: ['nimble escape'],
            reactiveAbilities: ['opportunity attack'],
            speed: { baseSpeed: 25, otherSpeeds: { climb: 10 } },
            meleeAttacks: [
                { name: 'Shortsword', attackModifier: 6, traits: ['agile'], damage: '1d6+2', effects: ['bleed'] }
            ],
            rangedAttacks: [
                { name: 'Shortbow', attackModifier: 5, range: 60, traits: ['propulsive'], damage: '1d6', effects: [] }
            ],
            spells: {
                tradition: 'arcane',
                type: 'prepared',
                dc: 15,
                spellList: { 1: ['magic missile'] },
                cantrips: ['detect magic']
            },
            innateSpells: {
                spellList: { 1: ['charm'] },
                atWill: ['daze'],
                constant: ['mage armor']
            },
            focusSpells: {
                focusPoints: 1,
                dc: 14,
                spellList: { 1: ['heal'] }
            },
            rituals: ['commune'],
            offensiveAbilities: ['sneak attack']
        });

        expect(statblock.name).toBe('Goblin');
        expect(statblock.rarity).toBe('common');
        expect(statblock.size).toBe('small');
        expect(statblock.traits).toContain('goblin');
        expect(statblock.perception?.modifier).toBe(5);
        expect(statblock.languages).toContain('Goblin');
        expect(statblock.skills?.stealth).toBe(7);
        expect(statblock.attributes?.dexterity).toBe(14);
        expect(statblock.items).toContain('shortsword');
        expect(statblock.interactionAbilities).toContain('taunt');
        expect(statblock.defenses?.ac).toBe(16);
        expect(statblock.defenses?.savingThrows?.reflex).toBe(6);
        expect(statblock.defenses?.immunities).toContain('poison');
        expect(statblock.automaticAbilities).toContain('nimble escape');
        expect(statblock.reactiveAbilities).toContain('opportunity attack');
        expect(statblock.speed?.baseSpeed).toBe(25);
        expect(statblock.meleeAttacks?.[0].name).toBe('Shortsword');
        expect(statblock.rangedAttacks?.[0].name).toBe('Shortbow');
        expect(statblock.spells?.tradition).toBe('arcane');
        expect(statblock.innateSpells?.atWill).toContain('daze');
        expect(statblock.focusSpells?.focusPoints).toBe(1);
        expect(statblock.rituals).toContain('commune');
        expect(statblock.offensiveAbilities).toContain('sneak attack');
    });

    it('should allow missing optional properties', () => {
        const level = new Level(1);
        const statblock = new Statblock({ level });
        expect(statblock.level.valueOf()).toBe(1);
        expect(statblock.name).toBeUndefined();
        expect(statblock.traits).toBeUndefined();
    });
});