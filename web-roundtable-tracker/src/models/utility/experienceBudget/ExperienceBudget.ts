export class ExperienceBudget extends Number {
	constructor(value: number) {
		super(Math.round(value));
	}
	toString(): string {
		return `${this.valueOf()} XP`;
	}
	limit({
		min = 0,
		max = Number.POSITIVE_INFINITY,
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
		if (this.valueOf() > (base || 10)) {
			return this.round(base);
		}

		return this;
	}
	sum(budget: ExperienceBudget): ExperienceBudget {
		return new ExperienceBudget(this.valueOf() + budget.valueOf());
	}

	/**
	 * Convert a relative level (e.g., -2, 0, +3) to XP budget.
	 * Uses PF2e scaling: 40 * multiplier where multiplier depends on level difference.
	 * Relative level < -4 yields 0 XP (creatures too weak to be worth experience).
	 */
	static fromLevel(relativeLevel: number): ExperienceBudget {
		if (relativeLevel < -4) {
			return new ExperienceBudget(0);
		}

		const baseCost = 40;
		const difference = Math.trunc(relativeLevel);

		const multiplier = (() => {
			if (difference === 0) return 1;

			if (difference > 0) {
				if (difference % 2 === 0) {
					return Math.pow(2, difference / 2);
				}

				return 1.5 * Math.pow(2, (difference - 1) / 2);
			}

			const absoluteDifference = Math.abs(difference);

			if (absoluteDifference % 2 === 0) {
				return 1 / Math.pow(2, absoluteDifference / 2);
			}

			return 0.75 / Math.pow(2, (absoluteDifference - 1) / 2);
		})();

		const xp = baseCost * multiplier;

		return new ExperienceBudget(xp);
	}

	private static resolveCharacterAdjustmentValue(baseReward: number): number {
		if (baseReward <= 40) {
			return Math.max(0, Math.round(baseReward / 4));
		}

		if (baseReward <= 80) {
			return 20;
		}

		if (baseReward <= 120) {
			return 30;
		}

		if (baseReward <= 160) {
			return 40;
		}

		if (baseReward <= 200) {
			return 50;
		}

		if (baseReward <= 240) {
			return 60;
		}

		return 60 + Math.floor((baseReward - 241) / 40 + 1) * 10;
	}

	static budgetToBaseReward = (
		xpBudget: ExperienceBudget,
		partySize: number = 4
	): ExperienceBudget => {
		const deltaCharacters = partySize - 4;

		if (deltaCharacters === 0) {
			return xpBudget;
		}

		const value = xpBudget.valueOf();
		const searchLowerBound = deltaCharacters === 0 ? 0 : 40;
		const searchUpperBound = Math.max(
			400,
			value + Math.abs(deltaCharacters) * 120
		);

		let bestBaseReward = searchLowerBound;
		let bestDifference = Number.POSITIVE_INFINITY;

		for (
			let candidate = searchLowerBound;
			candidate <= searchUpperBound;
			candidate += 1
		) {
			const adjustment =
				ExperienceBudget.resolveCharacterAdjustmentValue(candidate);
			const adjustedBudget = candidate + deltaCharacters * adjustment;
			const difference = Math.abs(adjustedBudget - value);

			if (
				difference < bestDifference ||
				(difference === bestDifference &&
					Math.abs(candidate - value) < Math.abs(bestBaseReward - value))
			) {
				bestDifference = difference;
				bestBaseReward = candidate;

				if (difference === 0) {
					break;
				}
			}
		}

		return new ExperienceBudget(bestBaseReward).roundIfHigher(20);
	};

	static budgetToCharacterAdjustment = (
		xpBudget: ExperienceBudget
	): ExperienceBudget => {
		return new ExperienceBudget(
			ExperienceBudget.resolveCharacterAdjustmentValue(xpBudget.valueOf())
		);
	};
	static get Trivial(): ExperienceBudget {
		return new ExperienceBudget(40);
	}
	static get Low(): ExperienceBudget {
		return new ExperienceBudget(60);
	}
	static get Moderate(): ExperienceBudget {
		return new ExperienceBudget(80);
	}
	static get ModeratePlus(): ExperienceBudget {
		return new ExperienceBudget(100);
	}
	static get Severe(): ExperienceBudget {
		return new ExperienceBudget(120);
	}
	static get SeverePlus(): ExperienceBudget {
		return new ExperienceBudget(140);
	}
	static get Extreme(): ExperienceBudget {
		return new ExperienceBudget(160);
	}
	static get ExtremePlus(): ExperienceBudget {
		return new ExperienceBudget(180);
	}
	static get Extreme2Plus(): ExperienceBudget {
		return new ExperienceBudget(200);
	}
	static get Extreme3Plus(): ExperienceBudget {
		return new ExperienceBudget(220);
	}
	static get Impossible(): ExperienceBudget {
		return new ExperienceBudget(240);
	}
}
