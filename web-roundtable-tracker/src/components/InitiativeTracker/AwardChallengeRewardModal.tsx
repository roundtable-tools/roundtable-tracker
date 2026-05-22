import React, { useState } from 'react';
import type { SkillChallengeSlot, SkillChallengeProgress } from '@/store/data';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, AlertTriangle } from 'lucide-react';

interface AwardChallengeRewardModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	skillChallenge: SkillChallengeSlot;
	progress: SkillChallengeProgress;
	mode: 'reward' | 'penalty';
	onSelected: (id: string) => void;
	onSkip: () => void;
}

export default function AwardChallengeRewardModal({
	open,
	onOpenChange,
	skillChallenge,
	progress,
	mode,
	onSelected,
	onSkip,
}: AwardChallengeRewardModalProps) {
	const isReward = mode === 'reward';
	const options = isReward
		? (skillChallenge.rewards ?? [])
		: (skillChallenge.penalties ?? []);
	const awardedIds = isReward
		? (progress.awardedRewardIds ?? [])
		: (progress.awardedPenaltyIds ?? []);

	const isOneTimeUsed = (id: string) => {
		const option = options.find((o) => o.id === id);
		return !option?.multipleTimesAllowed && awardedIds.includes(id);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{isReward ? 'Choose Reward' : 'Choose Penalty'}</DialogTitle>
					<DialogDescription>
						{isReward
							? 'Select a reward to award for this success.'
							: 'Select a penalty to apply for this failure.'}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="h-96 pr-4">
					<div className="space-y-2">
						{options.length === 0 ? (
							<p className="text-center text-sm text-muted-foreground py-8">
								No {isReward ? 'rewards' : 'penalties'} configured
							</p>
						) : (
							options.map((option) => {
								const isDisabled = isOneTimeUsed(option.id);
								return (
									<button
										key={option.id}
										onClick={() => !isDisabled && onSelected(option.id)}
										disabled={isDisabled}
										className={`w-full text-left p-3 rounded-lg border transition-colors ${
											isDisabled
												? 'opacity-50 cursor-not-allowed bg-muted'
												: 'hover:bg-accent cursor-pointer border-input'
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1">
												<div className="flex items-center gap-1 text-sm font-medium">
													{isReward
														? <Trophy className="h-3.5 w-3.5 text-amber-500" />
														: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
													}
													{option.name}
												</div>
												{option.description && (
													<p className="mt-1 text-xs text-muted-foreground">
														{option.description}
													</p>
												)}
												{!option.multipleTimesAllowed && (
													<p className="mt-0.5 text-xs text-muted-foreground/70">One-time only</p>
												)}
											</div>
											{isDisabled && (
												<Badge variant="secondary" className="text-xs">
													Used
												</Badge>
											)}
										</div>
									</button>
								);
							})
						)}
					</div>
				</ScrollArea>

				<div className="flex justify-end pt-2">
					<Button variant="ghost" size="sm" onClick={onSkip}>
						Skip {isReward ? 'Reward' : 'Penalty'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
