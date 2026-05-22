import type { Status } from '@/CommandHistory/common';
import { STATUS, getDeps } from '@/CommandHistory/common';
import type { Command, CommandDeps } from '@/CommandHistory/common';
import type { SkillChallengeOutcome } from '@/models/encounters/skillChallenge.types';

export type EndSkillChallengeCommandProps = {
	skillChallengeId: string;
	participantId?: string; // Only needed if !shared
	result: SkillChallengeOutcome;
};

export type EndSkillChallengeCommandData = EndSkillChallengeCommandProps & {
	wasActive?: boolean;
	previousEndedAt?: number;
};

/**
 * End a skill challenge for a participant or for the whole party (if shared).
 * Determines the outcome based on success/failure counts.
 */
export class EndSkillChallengeCommand implements Command {
	readonly type = 'EndSkillChallengeCommand';
	data: EndSkillChallengeCommandData;
	description = 'End Skill Challenge';

	constructor(
		props: EndSkillChallengeCommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute(): Status {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const round = state.round ?? 0;
		const skillChallenges = state.skillChallengesActive ?? [];

		const challengeIndex = skillChallenges.findIndex(
			(sc) => sc.id === this.data.skillChallengeId
		);
		if (challengeIndex === -1) {
			return STATUS.failure;
		}

		const challenge = skillChallenges[challengeIndex];

		// Save previous state for undo
		this.data.wasActive = challenge.isActive;
		this.data.previousEndedAt = challenge.endedAt;

		// Mark as ended
		challenge.isActive = false;
		challenge.endedAt = round;

		// Update store
		encounterStore
			.getState()
			.updateSkillChallengeProgress(this.data.skillChallengeId);

		return STATUS.success;
	}

	undo(): Status {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const skillChallenges = state.skillChallengesActive ?? [];

		const challenge = skillChallenges.find(
			(sc) => sc.id === this.data.skillChallengeId
		);
		if (!challenge) {
			return STATUS.failure;
		}

		// Restore previous state
		challenge.isActive = this.data.wasActive ?? true;
		challenge.endedAt = this.data.previousEndedAt;

		// Update store
		encounterStore
			.getState()
			.updateSkillChallengeProgress(this.data.skillChallengeId);

		return STATUS.success;
	}
}
