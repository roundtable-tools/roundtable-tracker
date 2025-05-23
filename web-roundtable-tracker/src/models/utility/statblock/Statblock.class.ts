import { Level } from "../level/Level";

export class Statblock {
    name?: string;
    level: Level;
    rarity?: string;
    size?: string;
    traits?: string[];
    perception?: {
        modifier: number;
        specialSenses?: string[];
    };
    languages?: string[];
    skills?: Record<string, number>;
    attributes?: {
        strength?: number;
        dexterity?: number;
        constitution?: number;
        intelligence?: number;
        wisdom?: number;
        charisma?: number;
    };
    items?: string[];
    interactionAbilities?: string[];
    defenses?: {
        ac?: number;
        savingThrows?: {
            fortitude?: number;
            reflex?: number;
            will?: number;
        };
        hp?: number;
        immunities?: string[];
        weaknesses?: string[];
        resistances?: string[];
    };
    automaticAbilities?: string[];
    reactiveAbilities?: string[];
    speed?: {
        baseSpeed?: number;
        otherSpeeds?: Record<string, number>;
    };
    meleeAttacks?: {
        name: string;
        attackModifier: number;
        traits?: string[];
        damage: string;
        effects?: string[];
    }[];
    rangedAttacks?: {
        name: string;
        attackModifier: number;
        range: number;
        traits?: string[];
        damage: string;
        effects?: string[];
    }[];
    spells?: {
        tradition: string;
        type: 'prepared' | 'spontaneous';
        dc: number;
        attackModifier?: number;
        spellList: Record<number, string[]>;
        cantrips?: string[];
    };
    innateSpells?: {
        spellList: Record<number, string[]>;
        atWill?: string[];
        constant?: string[];
    };
    focusSpells?: {
        focusPoints: number;
        dc: number;
        spellList: Record<number, string[]>;
    };
    rituals?: string[];
    offensiveAbilities?: string[];

    constructor({level, ...rest}: Statblock) {
        this.level = level;
        Object.assign(this, rest);
    }
}