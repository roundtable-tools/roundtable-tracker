import { ExperienceBudget } from '../experienceBudget/ExperienceBudget';

export const THREAT_TYPE = {
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
	10: 'Impossible',
} as const;
type ThreatID = typeof THREAT_TYPE;
type ThreatType = (typeof THREAT_TYPE)[keyof typeof THREAT_TYPE];
type ThreatProperty<T extends ThreatType> = T extends `${infer Base}+++`
	? `${Base}3Plus`
	: T extends `${infer Base}++`
		? `${Base}2Plus`
		: T extends `${infer Base}+`
			? `${Base}Plus`
			: T extends string
				? T
				: never;
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
		const characterAdjustment =
			ExperienceBudget.budgetToCharacterAdjustment(baseReward);

		return new ExperienceBudget(
			baseReward.valueOf() + characterAdjustment.valueOf() * (partySize - 4)
		);
	}
	/**
	 * Minimum XP for each threat at the given party size, in threat order.
	 * Each value is the threat's budget (`toExpBudget`), raised to the previous
	 * one where small parties would make a higher threat cheaper than a lower one.
	 * Trivial has no minimum: anything below the Low budget is Trivial.
	 */
	static thresholds(
		partySize: number = 4
	): { threat: Threat; minXp: number }[] {
		const keys = Object.keys(THREAT_TYPE)
			.map(Number)
			.sort((a, b) => a - b) as (keyof ThreatID)[];
		let previousMinXp = Number.NEGATIVE_INFINITY;

		return keys.map((key) => {
			const threat = new Threat({ threat: key });

			if (key === 0) {
				return { threat, minXp: Number.NEGATIVE_INFINITY };
			}

			const minXp = Math.max(
				threat.toExpBudget(partySize).valueOf(),
				previousMinXp
			);
			previousMinXp = minXp;

			return { threat, minXp };
		});
	}
	/**
	 * The highest threat whose budget the XP reaches ("at or above"):
	 * for 4 PCs, 60–79 XP is Low, 80–99 Moderate, 100–119 Moderate+, and so on.
	 * An encounter worth no XP is always Trivial.
	 */
	static fromExperienceBudget(
		budget: ExperienceBudget,
		partySize: number = 4
	): Threat {
		const xp = budget.valueOf();

		if (xp <= 0) {
			return Threat.Trivial;
		}

		return Threat.thresholds(partySize).reduce(
			(reached, { threat, minXp }) => (xp >= minXp ? threat : reached),
			Threat.Trivial
		);
	}
	static get Trivial(): Threat {
		return new Threat({ threat: 0 });
	}
	static get Low(): Threat {
		return new Threat({ threat: 1 });
	}
	static get Moderate(): Threat {
		return new Threat({ threat: 2 });
	}
	static get ModeratePlus(): Threat {
		return new Threat({ threat: 3 });
	}
	static get Severe(): Threat {
		return new Threat({ threat: 4 });
	}
	static get SeverePlus(): Threat {
		return new Threat({ threat: 5 });
	}
	static get Extreme(): Threat {
		return new Threat({ threat: 6 });
	}
	static get ExtremePlus(): Threat {
		return new Threat({ threat: 7 });
	}
	static get Extreme2Plus(): Threat {
		return new Threat({ threat: 8 });
	}
	static get Extreme3Plus(): Threat {
		return new Threat({ threat: 9 });
	}
	static get Impossible(): Threat {
		return new Threat({ threat: 10 });
	}
}
