import { ExperienceBudget } from "../experienceBudget/ExperienceBudget";

const THREAT_TYPE = {
    0: 'Trivial',
    1: 'Low',
    2: 'Moderate',
    3: 'Moderate+',
    4: 'Severe',
    5: 'Severe+',
    6: 'Extreme',
    7: 'Extreme+',
    8: 'Extreme++',
    9: 'Extreme+++',
    10: 'Impossible'
} as const
type ThreatID = typeof THREAT_TYPE;
type ThreatType = typeof THREAT_TYPE[keyof typeof THREAT_TYPE];
type ThreatProperty<T extends ThreatType> =
    T extends `${infer Base}+++` ? `${Base}3Plus` :
    T extends `${infer Base}++` ? `${Base}2Plus` :
    T extends `${infer Base}+` ? `${Base}Plus` :
    T extends string ? T :
    never;
interface ThreatProps {
    level?: number;
    threat: keyof ThreatID;
}

export class Threat {
    public level?: number;
    public threat: keyof ThreatID;
    constructor(props: ThreatProps) {
        this.level = props.level;
        this.threat = props.threat;
    }
    toString(): string {
        return `${this.toLabel()} (${this.level})`;
    }
    toLabel(): ThreatType {
        return THREAT_TYPE[this.threat];
    }
    toProperty(): ThreatProperty<ThreatType> {
        return THREAT_TYPE[this.threat]
        .replace('+++', '3Plus')
        .replace('++', '2Plus')  
        .replace('+', 'Plus') as ThreatProperty<ThreatType>;
    }
    toExpBudget(partySize: number = 4): ExperienceBudget {
        const baseReward = ExperienceBudget[this.toProperty()];
        const characterAdjustment = ExperienceBudget.budgetToCharacterAdjustment(baseReward);

        return new ExperienceBudget(baseReward.valueOf() + characterAdjustment.valueOf()*(partySize - 4));
    }
    static fromExperienceBudget(budget: ExperienceBudget, partySize:number = 4): Threat {
        const baseReward = ExperienceBudget.budgetToBaseReward(budget, partySize);

        switch (true) {
            case baseReward.valueOf() <= 40: return Threat.Trivial;

            case baseReward.valueOf() <= 60: return Threat.Low;

            case baseReward.valueOf() <= 80: return Threat.Moderate;

            case baseReward.valueOf() <= 100: return Threat.ModeratePlus;

            case baseReward.valueOf() <= 120: return Threat.Severe;

            case baseReward.valueOf() <= 140: return Threat.SeverePlus;

            case baseReward.valueOf() <= 160: return Threat.Extreme;

            case baseReward.valueOf() <= 180: return Threat.ExtremePlus;

            case baseReward.valueOf() <= 200: return Threat.Extreme2Plus;

            case baseReward.valueOf() <= 220: return Threat.Extreme3Plus;
            
            default: return Threat.Impossible;
        }
    }
    static get Trivial(): Threat { return new Threat({ threat: 0 }); }
    static get Low(): Threat { return new Threat({ threat: 1 }); }
    static get Moderate(): Threat { return new Threat({ threat: 2 }); }
    static get ModeratePlus(): Threat { return new Threat({ threat: 3 }); }
    static get Severe(): Threat { return new Threat({ threat: 4 }); }
    static get SeverePlus(): Threat { return new Threat({ threat: 5 }); }
    static get Extreme(): Threat { return new Threat({ threat: 6 }); }
    static get ExtremePlus(): Threat { return new Threat({ threat: 7 }); }
    static get Extreme2Plus(): Threat { return new Threat({ threat: 8 }); }
    static get Extreme3Plus(): Threat { return new Threat({ threat: 9 }); }
    static get Impossible(): Threat { return new Threat({ threat: 10 }); }
}