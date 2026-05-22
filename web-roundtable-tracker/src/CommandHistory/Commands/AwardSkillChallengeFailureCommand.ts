import type { Status } from '@/CommandHistory/common';
import { STATUS, getDeps } from '@/CommandHistory/common';
import type { Command, CommandDeps } from '@/CommandHistory/common';

export type AwardSkillChallengeFailureCommandProps = {
	skillChallengeId: string;
	participantId?: string; // Only needed if !shared
	penaltyId?: string; // Optional: which penalty to award
};

export type AwardSkillChallengeFailureCommandData =
	AwardSkillChallengeFailureCommandProps & {
		previousFailureCount?: number;
		previousAwardedPenaltyIds?: string[];
	};

/**
 * Award a failure to a skill challenge.
 * If a penaltyId is provided, tracks which penalties have been awarded.
 */
export class AwardSkillChallengeFailureCommand implements Command {
	readonly type = 'AwardSkillChallengeFailureCommand';
	data: AwardSkillChallengeFailureCommandData;
	description = 'Award Skill Challenge Failure';

	constructor(
		props: AwardSkillChallengeFailureCommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute(): Status {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const skillChallenges = state.skillChallengesActive ?? [];

		const challenge = skillChallenges.find(
			(sc) => sc.id === this.data.skillChallengeId
		);

		if (!challenge) {
			return STATUS.failure;
		}

		// Update progress
		if (challenge.shared && challenge.progressShared) {
			this.data.previousFailureCount = challenge.progressShared.failureCount;
			this.data.previousAwardedPenaltyIds =
				challenge.progressShared.awardedPenaltyIds;

			challenge.progressShared.failureCount += 1;

			if (this.data.penaltyId) {
				challenge.progressShared.awardedPenaltyIds.push(this.data.penaltyId);
			}
		} else if (!challenge.shared && challenge.progressByParticipant) {
			const participantId = this.data.participantId;

			if (!participantId) {
				return STATUS.failure;
			}

			if (!challenge.progressByParticipant[participantId]) {
				challenge.progressByParticipant[participantId] = {
					successCount: 0,
					failureCount: 0,
					awardedRewardIds: [],
					awardedPenaltyIds: [],
				};
			}

			const progress = challenge.progressByParticipant[participantId];
			this.data.previousFailureCount = progress.failureCount;
			this.data.previousAwardedPenaltyIds = progress.awardedPenaltyIds;

			progress.failureCount += 1;

			if (this.data.penaltyId) {
				progress.awardedPenaltyIds.push(this.data.penaltyId);
			}
		}

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

		if (!challenge || this.data.previousFailureCount === undefined) {
			return STATUS.failure;
		}

		// Restore previous state
		if (challenge.shared && challenge.progressShared) {
			challenge.progressShared.failureCount = this.data.previousFailureCount;
			challenge.progressShared.awardedPenaltyIds =
				this.data.previousAwardedPenaltyIds ?? [];
		} else if (!challenge.shared && challenge.progressByParticipant) {
			const participantId = this.data.participantId;

			if (!participantId || !challenge.progressByParticipant[participantId]) {
				return STATUS.failure;
			}

			const progress = challenge.progressByParticipant[participantId];
			progress.failureCount = this.data.previousFailureCount;
			progress.awardedPenaltyIds = this.data.previousAwardedPenaltyIds ?? [];
		}

		// Update store
		encounterStore
			.getState()
			.updateSkillChallengeProgress(this.data.skillChallengeId);

		return STATUS.success;
	}
}
