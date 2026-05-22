import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import type { ChallengeRewardOption } from '@/models/encounters/skillChallenge.types';

interface RewardPenaltyListProps {
	items: ChallengeRewardOption[];
	onItemsChange: (items: ChallengeRewardOption[]) => void;
	label: string;
	placeholder: string;
}

export function RewardPenaltyList({
	items,
	onItemsChange,
	label,
	placeholder,
}: RewardPenaltyListProps) {
	const [open, setOpen] = useState(false);
	const [formName, setFormName] = useState('');
	const [formDescription, setFormDescription] = useState('');
	const [formMultiple, setFormMultiple] = useState(false);

	const handleAdd = () => {
		if (!formName.trim()) {
			return;
		}

		const newItem: ChallengeRewardOption = {
			id: uuidv4(),
			name: formName.trim(),
			description: formDescription.trim(),
			multipleTimesAllowed: formMultiple,
		};

		onItemsChange([...items, newItem]);

		// Reset form
		setFormName('');
		setFormDescription('');
		setFormMultiple(false);
		setOpen(false);
	};

	const handleRemove = (id: string) => {
		onItemsChange(items.filter((item) => item.id !== id));
	};

	return (
		<div className="space-y-2 rounded-md border p-3">
			<div className="flex items-center justify-between">
				<h4 className="font-medium">{label}</h4>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => setOpen(true)}
				>
					Add
				</Button>
			</div>

			{items.length === 0 ? (
				<p className="text-xs text-muted-foreground">{placeholder}</p>
			) : (
				<div className="space-y-1">
					{items.map((item) => (
						<div
							key={item.id}
							className="flex items-start justify-between gap-2 rounded-sm bg-muted/50 p-2 text-sm"
						>
							<div className="flex-1">
								<p className="font-medium">{item.name}</p>
								<p className="text-xs text-muted-foreground">
									{item.description}
								</p>
								{!item.multipleTimesAllowed && (
									<p className="text-xs text-yellow-600 dark:text-yellow-500">
										One-time only
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={() => handleRemove(item.id)}
								className="shrink-0 rounded hover:bg-destructive/10"
							>
								<X className="size-4" />
							</button>
						</div>
					))}
				</div>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Add {label.slice(0, -1)}</DialogTitle>
						<DialogDescription>
							Create a new {label.toLowerCase().slice(0, -1)} option
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium">Name</label>
							<Input
								type="text"
								placeholder="e.g., +2 to next attack"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								className="mt-1"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium">Description</label>
							<Textarea
								placeholder="Describe the reward or penalty..."
								value={formDescription}
								onChange={(e) => setFormDescription(e.target.value)}
								className="mt-1"
								rows={3}
							/>
						</div>

						<div className="flex items-center gap-2">
							<Switch
								checked={formMultiple}
								onCheckedChange={setFormMultiple}
								id="multiple-times"
							/>
							<label htmlFor="multiple-times" className="text-sm font-medium">
								Can be awarded multiple times
							</label>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleAdd}
							disabled={!formName.trim()}
						>
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
