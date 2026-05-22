import type {
	SkillChallengeSlot,
	SkillChallengeProgress,
} from '@/models/encounters/skillChallenge.types';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface EndChallengeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	skillChallenge: SkillChallengeSlot;
	progress: SkillChallengeProgress;
	onConfirm: () => void;
}

export default function EndChallengeModal({
	open,
	onOpenChange,
	skillChallenge,
	progress,
	onConfirm,
}: EndChallengeModalProps) {
	const succeeded = progress.successCount >= skillChallenge.successesRequired;
	const failureReached =
		progress.failureCount >= skillChallenge.failuresRequired;

	let outcome = 'ongoing';

	if (succeeded) {
		outcome = 'success';
	} else if (failureReached) {
		outcome = 'failure';
	}

	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>End Skill Challenge</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{outcome === 'success' && (
						<div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-3 flex items-center gap-2">
							<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
							<div className="text-sm text-green-800 dark:text-green-200">
								Challenge Completed Successfully!
							</div>
						</div>
					)}
					{outcome === 'failure' && (
						<div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-3 flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
							<div className="text-sm text-red-800 dark:text-red-200">
								Challenge Failed
							</div>
						</div>
					)}

					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Successes:</span>
							<span className="font-mono font-semibold">
								{progress.successCount}/{skillChallenge.successesRequired}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Failures:</span>
							<span className="font-mono font-semibold">
								{progress.failureCount}/{skillChallenge.failuresRequired}
							</span>
						</div>
					</div>

					{progress.awardedRewardIds &&
						progress.awardedRewardIds.length > 0 && (
							<div className="space-y-1 p-2 rounded bg-muted">
								<p className="text-xs font-medium">Rewards Earned:</p>
								<ul className="text-xs space-y-1">
									{progress.awardedRewardIds.map((rewardId) => {
										const reward = skillChallenge.rewards?.find(
											(r) => r.id === rewardId
										);

										return reward ? (
											<li
												key={rewardId}
												className="text-green-700 dark:text-green-300"
											>
												• {reward.name}
											</li>
										) : null;
									})}
								</ul>
							</div>
						)}

					{progress.awardedPenaltyIds &&
						progress.awardedPenaltyIds.length > 0 && (
							<div className="space-y-1 p-2 rounded bg-muted">
								<p className="text-xs font-medium">Penalties Applied:</p>
								<ul className="text-xs space-y-1">
									{progress.awardedPenaltyIds.map((penaltyId) => {
										const penalty = skillChallenge.penalties?.find(
											(p) => p.id === penaltyId
										);

										return penalty ? (
											<li
												key={penaltyId}
												className="text-red-700 dark:text-red-300"
											>
												• {penalty.name}
											</li>
										) : null;
									})}
								</ul>
							</div>
						)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Confirm End Challenge</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
