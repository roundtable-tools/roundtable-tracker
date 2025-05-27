import { Level } from "../utility/level/Level";
import { LevelRange } from "../utility/level/LevelRange";

type Activity<Label extends string=string, Bonus extends string=string, Skill extends string=string> = {
    label: Label;
    bonus?: Bonus;
    skill: Skill;
}

const ExplorationActivity = {
    avoidNotice: {
        label: "Avoid Notice",
        bonus: "Hidden from enemies lower in the initiative order",
        skill: "Stealth"
    },
    defend: {
        label: "Defend",
        bonus: "Gain the benefits of Raising a Shield before your first turn begins",
        skill: "Perception"
    },
    scout: {
        label: "Scout",
        skill: "Stealth"
    },
    track: {
        label: "Track",
        bonus: "Free Seek action (using Survival) for hidden things in the immediate area at the start of an encounter",
        skill: "Survival"
    },
    coverTracks: {
        label: "Cover Tracks",
        skill: "Survival"
    },
    investigate: {
        label: "Investigate",
        bonus: "Free Recall Knowledge (using a relevant skill) about findings",
        skill: "Varies"
    },
    search: {
        label: "Search",
        bonus: "Free Seek action (using Perception) for hidden things in the immediate area at the start of an encounter",
        skill: "Perception"
    },
    repeatASpell: {
        label: "Repeat a Spell",
        bonus: "Get an effect of a cantrip spell that costs 2 actions or fewer",
        skill: "Varies"
    },
    pursueALead: {
        label: "Pursue a Lead (Investigator)",
        bonus: "You gain an Investigation circumstance bonus to initiative and other skill checks related to the lead",
        skill: "Perception"
    },
    coerce: {
        label: "Coerce",
        skill: "Intimidation"
    },
    makeAnImpression: {
        label: "Make an Impression",
        skill: "Diplomacy"
    },
    impersonate: {
        label: "Impersonate",
        skill: "Deception"
    }
} as const satisfies Record<string,Activity>;

interface PartyCharacter {
    name: string;
    title: number;
    level: Level;
    explorationActivity?: keyof typeof ExplorationActivity;
}

export class PartyConfiguration {
    public partyName: string;
    private party: PartyCharacter[];
    get partyLevel(): LevelRange {
        return LevelRange.fromLevels(this.party.map(character => character.level));
    }
    get partySize(): number {
        return this.party.length;
    }
    get partyLevelAverage(): number {
        return this.party.reduce((acc, character) => acc + character.level.valueOf(), 0) / this.partySize;
    }
    constructor(partyName?: string, party?: PartyCharacter[]) {
        this.partyName = partyName || "PCs";
        this.party = party || [];
    }
}