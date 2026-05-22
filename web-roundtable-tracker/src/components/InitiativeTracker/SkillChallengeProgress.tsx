import { useState } from 'react';
import type { SkillChallengeSlot } from '@/store/data';
import type { SkillChallengeProgress as SkillChallengeProgressType } from '@/models/encounters/skillChallenge.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, X, Trophy } from 'lucide-react';
import AwardChallengeRewardModal from '@/components/InitiativeTracker/AwardChallengeRewardModal';
import EndChallengeModal from '@/components/InitiativeTracker/EndChallengeModal';

interface SkillChallengeProgressProps {
	skillChallenge: SkillChallengeSlot;
	participantId?: string;
	onAwardSuccess: (rewardId?: string) => void;
	onAwardFailure: (penaltyId?: string) => void;
	onEndChallenge: () => void;
}

export default function SkillChallengeProgress({
	skillChallenge,
	participantId,
	onAwardSuccess,
	onAwardFailure,
	onEndChallenge,
}: SkillChallengeProgressProps) {
	const [showRewardModal, setShowRewardModal] = useState(false);
	const [showPenaltyModal, setShowPenaltyModal] = useState(false);
	const [showEndModal, setShowEndModal] = useState(false);

	// Get the progress - shared or per-participant
	const progress: SkillChallengeProgressType | undefined = skillChallenge.shared
		? skillChallenge.progressShared
		: participantId
			? skillChallenge.progressByParticipant?.[participantId]
			: undefined;

	if (!progress) return null;

	const successesRequired = skillChallenge.successesRequired;
	const failuresRequired = skillChallenge.failuresRequired;
	const successPercent = (progress.successCount / successesRequired) * 100;
	const failurePercent = (progress.failureCount / failuresRequired) * 100;
	const maxSuccessReached = progress.successCount >= successesRequired;
	const maxFailureReached = progress.failureCount >= failuresRequired;
	const isCompleted =
		maxSuccessReached || maxFailureReached || !skillChallenge.isActive;
	const succeeded = maxSuccessReached;
	const hasRewards = (skillChallenge.rewards?.length ?? 0) > 0;
	const hasPenalties = (skillChallenge.penalties?.length ?? 0) > 0;

	const handleSuccessClick = () => {
		if (hasRewards) {
			setShowRewardModal(true);
		} else {
			onAwardSuccess();
		}
	};

	const handleFailureClick = () => {
		if (hasPenalties) {
			setShowPenaltyModal(true);
		} else {
			onAwardFailure();
		}
	};

	return (
		<Card className="p-4 space-y-3">
			<div className="space-y-1">
				<h4 className="font-medium text-sm">
					{skillChallenge.name ||
						skillChallenge.description ||
						'Skill Challenge'}
				</h4>
				{skillChallenge.description && skillChallenge.name && (
					<p className="text-xs text-muted-foreground">
						{skillChallenge.description}
					</p>
				)}
				<p className="text-xs text-muted-foreground">
					Successes: {progress.successCount}/{successesRequired}
					{' • '}
					Failures: {progress.failureCount}/{failuresRequired}
				</p>
			</div>

			{/* Success Progress */}
			<div className="space-y-1">
				<div className="flex items-center justify-between text-xs">
					<span className="text-green-600 dark:text-green-400">Successes</span>
					<span className="font-mono">{progress.successCount}</span>
				</div>
				<Progress value={Math.min(successPercent, 100)} className="h-2" />
			</div>

			{/* Failure Progress */}
			<div className="space-y-1">
				<div className="flex items-center justify-between text-xs">
					<span className="text-red-600 dark:text-red-400">Failures</span>
					<span className="font-mono">{progress.failureCount}</span>
				</div>
				<Progress value={Math.min(failurePercent, 100)} className="h-2" />
			</div>

			{/* Awarded Rewards/Penalties */}
			{(progress.awardedRewardIds?.length ?? 0) > 0 && (
				<div className="space-y-1">
					<p className="text-xs text-muted-foreground">Rewards</p>
					<div className="flex flex-wrap gap-1">
						{progress.awardedRewardIds.map((rewardId) => {
							const reward = skillChallenge.rewards?.find(
								(r) => r.id === rewardId
							);

							if (!reward) return null;
							const isOneTime = !reward.multipleTimesAllowed;
							const count = progress.awardedRewardIds.filter(
								(id) => id === rewardId
							).length;

							return (
								<Badge
									key={rewardId}
									variant="outline"
									className={isOneTime && count > 0 ? 'opacity-70' : ''}
									title={reward.description}
								>
									<Trophy className="w-3 h-3 mr-1" />
									{reward.name}
								</Badge>
							);
						})}
					</div>
				</div>
			)}

			{(progress.awardedPenaltyIds?.length ?? 0) > 0 && (
				<div className="space-y-1">
					<p className="text-xs text-muted-foreground">Penalties</p>
					<div className="flex flex-wrap gap-1">
						{progress.awardedPenaltyIds.map((penaltyId) => {
							const penalty = skillChallenge.penalties?.find(
								(p) => p.id === penaltyId
							);

							if (!penalty) return null;
							const isOneTime = !penalty.multipleTimesAllowed;
							const count = progress.awardedPenaltyIds.filter(
								(id) => id === penaltyId
							).length;

							return (
								<Badge
									key={penaltyId}
									variant="destructive"
									className={isOneTime && count > 0 ? 'opacity-70' : ''}
									title={penalty.description}
								>
									<X className="w-3 h-3 mr-1" />
									{penalty.name}
								</Badge>
							);
						})}
					</div>
				</div>
			)}

			{/* Control Buttons */}
			{!isCompleted && (
				<div className="grid grid-cols-3 gap-2 pt-2">
					<Button
						size="sm"
						variant="outline"
						className="border-green-500/50 text-green-600 hover:bg-green-500/10 dark:text-green-400"
						onClick={handleSuccessClick}
					>
						<CheckCircle className="mr-1 h-4 w-4" />
						Success
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:text-red-400"
						onClick={handleFailureClick}
					>
						<X className="mr-1 h-4 w-4" />
						Failure
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowEndModal(true)}
					>
						End
					</Button>
				</div>
			)}

			{isCompleted && (
				<div className="text-center">
					<div className="text-sm font-medium">
						{succeeded ? '✓ Challenge Succeeded' : '✗ Challenge Failed'}
					</div>
				</div>
			)}

			{/* Reward Modal */}
			<AwardChallengeRewardModal
				open={showRewardModal}
				onOpenChange={setShowRewardModal}
				skillChallenge={skillChallenge}
				progress={progress}
				mode="reward"
				onSelected={(rewardId) => {
					onAwardSuccess(rewardId);
					setShowRewardModal(false);
				}}
				onSkip={() => {
					onAwardSuccess();
					setShowRewardModal(false);
				}}
			/>

			{/* Penalty Modal */}
			<AwardChallengeRewardModal
				open={showPenaltyModal}
				onOpenChange={setShowPenaltyModal}
				skillChallenge={skillChallenge}
				progress={progress}
				mode="penalty"
				onSelected={(penaltyId) => {
					onAwardFailure(penaltyId);
					setShowPenaltyModal(false);
				}}
				onSkip={() => {
					onAwardFailure();
					setShowPenaltyModal(false);
				}}
			/>

			<EndChallengeModal
				open={showEndModal}
				onOpenChange={setShowEndModal}
				skillChallenge={skillChallenge}
				progress={progress}
				onConfirm={onEndChallenge}
			/>
		</Card>
	);
}
