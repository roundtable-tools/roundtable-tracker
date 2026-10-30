import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type PersistentDamage } from '@/store/data';
import { evaluateSumExpression } from '@/utils/sumExpression';
import { PERSISTENT_DAMAGE_ICONS } from './persistentDamage';

/**
 * One persistent damage entry at the end of a participant's turn (or when it
 * delays). The damage field starts at the damage last taken; Damage deals
 * what it holds, once, and keeps it for next time. A participant without HP
 * data gets no damage field, only the entry. End Persistent Damage is for a
 * passed recovery check. Continue, the close button or Escape keeps
 * the entry for the next turn.
 */
export function PersistentDamageDialog({
	participantName,
	damage,
	hasHp,
	position,
	onDamage,
	onEnd,
	onContinue,
}: {
	participantName: string;
	damage: PersistentDamage;
	hasHp: boolean;
	/** Which of the participant's entries this is, when it has more than one. */
	position?: { index: number; count: number };
	onDamage: (amount: number) => void;
	onEnd: () => void;
	onContinue: () => void;
}) {
	const [amount, setAmount] = useState(
		damage.amount !== undefined ? String(damage.amount) : ''
	);
	const [taken, setTaken] = useState<number | null>(null);
	const { Icon, label: type, className } = PERSISTENT_DAMAGE_ICONS[damage.icon];

	const handleDamage = () => {
		const value = evaluateSumExpression(amount);

		if (taken !== null || value === null || value <= 0) return;
		setTaken(value);
		onDamage(value);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onContinue();
			}}
		>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Persistent Damage</DialogTitle>
					<DialogDescription>
						{participantName} takes persistent damage
						{position ? ` (${position.index + 1} of ${position.count})` : ''}. A
						passed recovery check ends it.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 rounded-md border p-3">
					<p className="flex items-center gap-2 text-sm font-medium">
						<Icon className={`h-4 w-4 shrink-0 ${className}`} />
						<span>{type}</span>
						{damage.name?.trim() && (
							<span className="text-muted-foreground">
								{damage.name.trim()}
							</span>
						)}
					</p>
					{hasHp && (
						<div className="flex gap-2">
							<Input
								aria-label="Persistent damage amount"
								placeholder="Damage, e.g. 4+3"
								value={amount}
								disabled={taken !== null}
								autoFocus
								onChange={(e) => setAmount(e.target.value)}
								className="h-8 text-sm"
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleDamage();
								}}
							/>
							<Button
								size="sm"
								variant="outline"
								className="shrink-0 border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
								disabled={taken !== null}
								onClick={handleDamage}
							>
								Damage
							</Button>
						</div>
					)}
					{taken !== null && (
						<p className="text-xs text-muted-foreground">
							Took {taken} damage.
						</p>
					)}
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onEnd}>
						End Persistent Damage
					</Button>
					<Button onClick={onContinue}>Continue</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
