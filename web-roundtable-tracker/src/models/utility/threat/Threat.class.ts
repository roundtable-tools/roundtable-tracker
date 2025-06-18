import { ExperienceBudget } from "../experienceBudget/ExperienceBudget";

export const THREAT_TYPE = {
    0: 'Trivial-',
    1: 'Trivial',
    2: 'Low',
    3: 'Moderate',
    4: 'Moderate+',
    5: 'Severe',
    6: 'Severe+',
    7: 'Extreme',
    8: 'Extreme+',
    9: 'Extreme++',
    10: 'Extreme+++',
    11: 'Impossible'
} as const
type ThreatID = typeof THREAT_TYPE;
type ThreatType = typeof THREAT_TYPE[keyof typeof THREAT_TYPE];
type ThreatProperty<T extends ThreatType> =
    T extends `${infer Base}+++` ? `${Base}3Plus` :
    T extends `${infer Base}++` ? `${Base}2Plus` :
    T extends `${infer Base}+` ? `${Base}Plus` :
    T extends `${infer Base}-` ? `${Base}Minus` :
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
    static toLabel(threat: keyof ThreatID): ThreatType {
        return THREAT_TYPE[threat];
    }
    toProperty(): ThreatProperty<ThreatType> {
        return THREAT_TYPE[this.threat]
        .replace('+++', '3Plus')
        .replace('++', '2Plus')  
        .replace('+', 'Plus')
        .replace('-', 'Minus') as ThreatProperty<ThreatType>;
    }
    toExpBudget(partySize: number = 4): ExperienceBudget {
        const baseReward = ExperienceBudget[this.toProperty()];
        const characterAdjustment = ExperienceBudget.budgetToCharacterAdjustment(baseReward);

        return new ExperienceBudget(baseReward.valueOf() + characterAdjustment.valueOf()*(partySize - 4));
    }
    static fromExperienceBudget(budget: ExperienceBudget, partySize:number = 4): Threat {
        const normalized = new ExperienceBudget(budget.valueOf()*4/partySize);
        
        switch (true) {
            case normalized.valueOf() < 40: return Threat.TrivialMinus;

            case normalized.valueOf() < 60: return Threat.Trivial;

            case normalized.valueOf() < 80: return Threat.Low;

            case normalized.valueOf() < 100: return Threat.Moderate;

            case normalized.valueOf() < 120: return Threat.ModeratePlus;

            case normalized.valueOf() < 140: return Threat.Severe;

            case normalized.valueOf() < 160: return Threat.SeverePlus;

            case normalized.valueOf() < 180: return Threat.Extreme;

            case normalized.valueOf() < 200: return Threat.ExtremePlus;

            case normalized.valueOf() < 220: return Threat.Extreme2Plus;

            case normalized.valueOf() < 240: return Threat.Extreme3Plus;
            
            default: return Threat.Impossible;
        }
    }
    static get TrivialMinus(): Threat { return new Threat({ threat: 0 }); }
    static get Trivial(): Threat { return new Threat({ threat: 1 }); }
    static get Low(): Threat { return new Threat({ threat: 2 }); }
    static get Moderate(): Threat { return new Threat({ threat: 3 }); }
    static get ModeratePlus(): Threat { return new Threat({ threat: 4 }); }
    static get Severe(): Threat { return new Threat({ threat: 5 }); }
    static get SeverePlus(): Threat { return new Threat({ threat: 6 }); }
    static get Extreme(): Threat { return new Threat({ threat: 7 }); }
    static get ExtremePlus(): Threat { return new Threat({ threat: 8 }); }
    static get Extreme2Plus(): Threat { return new Threat({ threat: 9 }); }
    static get Extreme3Plus(): Threat { return new Threat({ threat: 10 }); }
    static get Impossible(): Threat { return new Threat({ threat: 11 }); }
}