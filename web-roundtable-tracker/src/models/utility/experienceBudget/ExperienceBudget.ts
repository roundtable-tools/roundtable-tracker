export class ExperienceBudget extends Number {
    constructor(value: number) {
        super(Math.round(value));
    }
    toString(): string {
        return `${this.valueOf()} XP`;
    }
    limit({
        min = 0,
        max = Number.POSITIVE_INFINITY
    }: {
        min?: number;
        max?: number;
    } = {}): ExperienceBudget {
        return new ExperienceBudget(Math.max(min, Math.min(this.valueOf(), max)));
    }
    round(base?: number): ExperienceBudget {
        base ??= 10;
        const value = this.valueOf();
        const roundedValue = Math.round(value / base) * base;
        
        return new ExperienceBudget(roundedValue);
    }
    roundIfHigher(base?: number): ExperienceBudget {
        if(this.valueOf() > (base || 10)) {
            return this.round(base);
        }

        return this;
    }
    sum(budget: ExperienceBudget): ExperienceBudget {
        return new ExperienceBudget(this.valueOf() + budget.valueOf());
    }
    static budgetToBaseReward = (xpBudget: ExperienceBudget, partySize: number = 4): ExperienceBudget => {
        return new ExperienceBudget(xpBudget.valueOf()*4/partySize).roundIfHigher(20);
    }
    static budgetToCharacterAdjustment = (xpBudget: ExperienceBudget, partySize: number = 4): ExperienceBudget => {
        return new ExperienceBudget((xpBudget.valueOf() - (partySize-4)*xpBudget.valueOf()/partySize)/4).roundIfHigher(10);
    }
    static get TrivialMinus(): ExperienceBudget { return new ExperienceBudget(20); }
    static get Trivial(): ExperienceBudget { return new ExperienceBudget(40); }
    static get Low(): ExperienceBudget { return new ExperienceBudget(60); }
    static get Moderate(): ExperienceBudget { return new ExperienceBudget(80); }
    static get ModeratePlus(): ExperienceBudget { return new ExperienceBudget(100); }
    static get Severe(): ExperienceBudget { return new ExperienceBudget(120); }
    static get SeverePlus(): ExperienceBudget { return new ExperienceBudget(140); }
    static get Extreme(): ExperienceBudget { return new ExperienceBudget(160); }
    static get ExtremePlus(): ExperienceBudget { return new ExperienceBudget(180); }
    static get Extreme2Plus(): ExperienceBudget { return new ExperienceBudget(200); }
    static get Extreme3Plus(): ExperienceBudget { return new ExperienceBudget(220); }
    static get Impossible(): ExperienceBudget { return new ExperienceBudget(240); }
}