import { STATUS, getDeps } from '@/CommandHistory/common';
import type { Command, CommandDeps } from '@/CommandHistory/common';
import type { Status } from '@/CommandHistory/common';

export type AwardSkillChallengeSuccessCommandProps = {
	skillChallengeId: string;
	participantId?: string; // Only needed if !shared
	rewardId?: string; // Optional: which reward to award
};

export type AwardSkillChallengeSuccessCommandData =
	AwardSkillChallengeSuccessCommandProps & {
		previousSuccessCount?: number;
		previousAwardedRewardIds?: string[];
	};

/**
 * Award a success to a skill challenge.
 * If a rewardId is provided, tracks which rewards have been awarded.
 */
export class AwardSkillChallengeSuccessCommand implements Command {
	readonly type = 'AwardSkillChallengeSuccessCommand';
	data: AwardSkillChallengeSuccessCommandData;
	description = 'Award Skill Challenge Success';

	constructor(
		props: AwardSkillChallengeSuccessCommandProps,
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
			this.data.previousSuccessCount = challenge.progressShared.successCount;
			this.data.previousAwardedRewardIds =
				challenge.progressShared.awardedRewardIds;

			challenge.progressShared.successCount += 1;

			if (this.data.rewardId) {
				challenge.progressShared.awardedRewardIds.push(this.data.rewardId);
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
			this.data.previousSuccessCount = progress.successCount;
			this.data.previousAwardedRewardIds = progress.awardedRewardIds;

			progress.successCount += 1;

			if (this.data.rewardId) {
				progress.awardedRewardIds.push(this.data.rewardId);
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

		if (!challenge || this.data.previousSuccessCount === undefined) {
			return STATUS.failure;
		}

		// Restore previous state
		if (challenge.shared && challenge.progressShared) {
			challenge.progressShared.successCount = this.data.previousSuccessCount;
			challenge.progressShared.awardedRewardIds =
				this.data.previousAwardedRewardIds ?? [];
		} else if (!challenge.shared && challenge.progressByParticipant) {
			const participantId = this.data.participantId;

			if (!participantId || !challenge.progressByParticipant[participantId]) {
				return STATUS.failure;
			}

			const progress = challenge.progressByParticipant[participantId];
			progress.successCount = this.data.previousSuccessCount;
			progress.awardedRewardIds = this.data.previousAwardedRewardIds ?? [];
		}

		// Update store
		encounterStore
			.getState()
			.updateSkillChallengeProgress(this.data.skillChallengeId);

		return STATUS.success;
	}
}
